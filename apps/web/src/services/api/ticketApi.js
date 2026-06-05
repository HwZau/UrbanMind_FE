// src/services/api/ticketApi.js
import { apiClient } from './apiClient';
import { mockDb } from '../../store/mockStore';

export const ticketApi = {
  getTickets(filters = {}) {
    return apiClient.request(() => {
      let tickets = mockDb.getTickets();

      if (filters.userId) {
        tickets = tickets.filter(t => t.userId === filters.userId);
      }
      if (filters.operatorId) {
        tickets = tickets.filter(t => t.assignment && t.assignment.operatorId === Number(filters.operatorId));
      }
      if (filters.status) {
        tickets = tickets.filter(t => t.status === filters.status);
      }
      if (filters.priority) {
        tickets = tickets.filter(t => t.priority === filters.priority);
      }
      if (filters.categoryId) {
        tickets = tickets.filter(t => t.categoryId === Number(filters.categoryId));
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        tickets = tickets.filter(t => 
          t.title.toLowerCase().includes(q) || 
          t.description.toLowerCase().includes(q) ||
          t.feedbackId.toLowerCase().includes(q)
        );
      }

      return tickets;
    });
  },

  getTicketById(feedbackId) {
    return apiClient.request(() => {
      const tickets = mockDb.getTickets();
      const ticket = tickets.find(t => t.feedbackId === feedbackId);
      if (!ticket) {
        throw new Error('Không tìm thấy phản ánh yêu cầu.');
      }
      return ticket;
    });
  },

  createTicket(userId, reporterName, ticketData) {
    return apiClient.request(() => {
      const tickets = mockDb.getTickets();
      
      // Call AI classifier
      const aiResult = mockDb.aiClassify(ticketData.title, ticketData.description);
      const categoryId = ticketData.categoryId || aiResult.categoryId;
      const priority = ticketData.priority || aiResult.urgencyLevel;

      const newTicket = {
        feedbackId: `fb-2026-${String(tickets.length + 1).padStart(3, '0')}`,
        userId,
        reporterName,
        categoryId: Number(categoryId),
        title: ticketData.title,
        description: ticketData.description,
        locationText: ticketData.locationText,
        latitude: ticketData.latitude || 10.7756,
        longitude: ticketData.longitude || 106.7019,
        priority,
        status: 'Submitted',
        dueDate: null,
        isMasterTicket: false,
        parentTicketId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: ticketData.attachments || [],
        assignment: null,
        sentiment: aiResult.sentiment,
        urgencyLevel: aiResult.urgencyLevel,
        confidenceScore: aiResult.confidenceScore,
        resolution: null,
        reviews: []
      };

      tickets.unshift(newTicket);
      mockDb.updateTickets(tickets);
      
      // Auto add initial system log
      mockDb.addAudit(userId, 'Create Feedback', 'Feedback', newTicket.feedbackId);

      // Create status history log
      const history = mockDb.get('urbanmind_history') || [];
      history.unshift({
        historyId: history.length + 1,
        feedbackId: newTicket.feedbackId,
        changedByUserId: userId,
        oldStatus: null,
        newStatus: 'Submitted',
        note: 'Người dân gửi phản ánh thành công qua Web portal.',
        changedAt: new Date().toISOString()
      });
      mockDb.set('urbanmind_history', history);

      // Send mock notification to Staff
      const notifs = mockDb.getNotifications();
      notifs.unshift({
        notificationId: notifs.length + 1,
        userId: 'u-102', // Staff ID
        title: 'Có phản ánh mới cần kiểm duyệt',
        message: `Phản ánh "${newTicket.title}" đã được tạo và phân loại tự động bởi AI.`,
        type: 'NewTicket',
        isRead: false,
        targetUrl: `/staff/queue`,
        createdAt: new Date().toISOString()
      });
      mockDb.updateNotifications(notifs);

      return newTicket;
    });
  },

  getComments(feedbackId) {
    return apiClient.request(() => {
      const comments = mockDb.getComments();
      return comments.filter(c => c.feedbackId === feedbackId);
    });
  },

  addComment(feedbackId, userId, userName, userRole, content) {
    return apiClient.request(() => {
      const comments = mockDb.getComments();
      const newComment = {
        commentId: comments.length + 1,
        feedbackId,
        userId,
        userName,
        userRole,
        content,
        createdAt: new Date().toISOString()
      };
      comments.push(newComment);
      mockDb.updateComments(comments);
      return newComment;
    });
  },

  // Staff action: Edit classification or approve
  verifyAndApprove(feedbackId, staffUserId, updateData) {
    return apiClient.request(() => {
      const tickets = mockDb.getTickets();
      const ticket = tickets.find(t => t.feedbackId === feedbackId);
      if (!ticket) throw new Error('Không tìm thấy vé.');

      const oldStatus = ticket.status;
      ticket.categoryId = Number(updateData.categoryId);
      ticket.priority = updateData.priority;
      ticket.status = 'AI Reviewed';
      ticket.updatedAt = new Date().toISOString();

      mockDb.updateTickets(tickets);
      mockDb.addAudit(staffUserId, 'Verify & Approve Category', 'Feedback', feedbackId, { oldStatus, categoryId: ticket.categoryId, priority: ticket.priority }, { status: 'AI Reviewed' });

      // Save status history
      const history = mockDb.get('urbanmind_history') || [];
      history.unshift({
        historyId: history.length + 1,
        feedbackId,
        changedByUserId: staffUserId,
        oldStatus,
        newStatus: 'AI Reviewed',
        note: `Nhân viên duyệt thông tin AI phân loại. Mức độ ưu tiên: ${ticket.priority}.`,
        changedAt: new Date().toISOString()
      });
      mockDb.set('urbanmind_history', history);

      return ticket;
    });
  },

  // Staff action: Merge duplicates
  mergeTickets(masterId, duplicateIds, staffUserId) {
    return apiClient.request(() => {
      const tickets = mockDb.getTickets();
      const master = tickets.find(t => t.feedbackId === masterId);
      if (!master) throw new Error('Không tìm thấy ticket Master.');

      master.isMasterTicket = true;
      master.updatedAt = new Date().toISOString();

      const notifs = mockDb.getNotifications();

      duplicateIds.forEach(dupId => {
        const dup = tickets.find(t => t.feedbackId === dupId);
        if (dup) {
          const oldStatus = dup.status;
          dup.parentTicketId = masterId;
          dup.status = 'Closed'; // Gộp thì đóng ticket con lại
          dup.updatedAt = new Date().toISOString();

          // Notify duplicate reporters
          notifs.unshift({
            notificationId: notifs.length + 1,
            userId: dup.userId,
            title: 'Phản ánh được gộp vào sự cố chung',
            message: `Phản ánh "${dup.title}" đã được gộp vào sự cố "${master.title}" đang được xử lý để tránh trùng lặp. Bạn có thể theo dõi tiến độ sự cố chính.`,
            type: 'StatusUpdate',
            isRead: false,
            targetUrl: `/tickets/${masterId}`,
            createdAt: new Date().toISOString()
          });
        }
      });

      mockDb.updateTickets(tickets);
      mockDb.updateNotifications(notifs);
      mockDb.addAudit(staffUserId, 'Merge Duplicates', 'Feedback', masterId, { duplicateIds });

      return master;
    });
  },

  // Operator actions
  updateOperatorStatus(feedbackId, operatorUserId, status, note, files = []) {
    return apiClient.request(() => {
      const tickets = mockDb.getTickets();
      const ticket = tickets.find(t => t.feedbackId === feedbackId);
      if (!ticket) throw new Error('Không tìm thấy phản ánh.');

      const oldStatus = ticket.status;
      ticket.status = status;
      ticket.updatedAt = new Date().toISOString();

      if (ticket.assignment) {
        ticket.assignment.status = status;
      }

      // If resolving the issue
      if (status === 'Resolved') {
        ticket.resolution = {
          resolutionId: Date.now(),
          operatorId: ticket.assignment?.operatorId || 1,
          resolvedBy: operatorUserId,
          resolutionSummary: note || 'Đã khắc phục hoàn tất sự cố phản ánh.',
          actionTaken: note || 'Tiến hành kiểm tra khu vực địa bàn và sửa chữa, thay mới trang thiết bị hư hại.',
          resultNote: 'Thi công an toàn, trả lại hiện trạng phục vụ cư dân.',
          resolvedAt: new Date().toISOString(),
          attachments: files.length > 0 ? files : ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80']
        };

        // Notify Staff for review
        const notifs = mockDb.getNotifications();
        notifs.unshift({
          notificationId: notifs.length + 1,
          userId: 'u-102', // Staff
          title: 'Đơn vị xử lý báo cáo hoàn thành công việc',
          message: `Công việc của phản ánh "${ticket.title}" đã được báo cáo hoàn tất. Vui lòng phê duyệt kiểm thử chất lượng.`,
          type: 'ResolutionSubmitted',
          isRead: false,
          targetUrl: `/staff/review`,
          createdAt: new Date().toISOString()
        });
        mockDb.updateNotifications(notifs);
      }

      mockDb.updateTickets(tickets);
      mockDb.addAudit(operatorUserId, `Operator Update: ${status}`, 'Feedback', feedbackId);

      // Save status history
      const history = mockDb.get('urbanmind_history') || [];
      history.unshift({
        historyId: history.length + 1,
        feedbackId,
        changedByUserId: operatorUserId,
        oldStatus,
        newStatus: status,
        note: note || `Đơn vị cập nhật tiến độ công việc sang: ${status}.`,
        changedAt: new Date().toISOString()
      });
      mockDb.set('urbanmind_history', history);

      return ticket;
    });
  },

  // Staff action: Approve or Request Rework on Resolution
  reviewResolution(feedbackId, staffUserId, isApproved, note) {
    return apiClient.request(() => {
      const tickets = mockDb.getTickets();
      const ticket = tickets.find(t => t.feedbackId === feedbackId);
      if (!ticket) throw new Error('Không tìm thấy phản ánh.');

      const oldStatus = ticket.status;
      const notifs = mockDb.getNotifications();

      if (isApproved) {
        ticket.status = 'Resolved';
        ticket.updatedAt = new Date().toISOString();

        // Notify User to rate
        notifs.unshift({
          notificationId: notifs.length + 1,
          userId: ticket.userId,
          title: 'Sự cố đã được xử lý thành công!',
          message: `Ban quản lý đã phê duyệt kết quả xử lý sự cố "${ticket.title}". Mời bạn để lại đánh giá chất lượng phục vụ.`,
          type: 'ResolutionReview',
          isRead: false,
          targetUrl: `/tickets/${feedbackId}`,
          createdAt: new Date().toISOString()
        });
      } else {
        ticket.status = 'In Progress'; // Rework
        ticket.updatedAt = new Date().toISOString();
        if (ticket.assignment) {
          ticket.assignment.status = 'InProgress';
          ticket.assignment.note = `YÊU CẦU XỬ LÝ LẠI: ${note}`;
        }
        ticket.resolution = null; // Clear resolution

        // Notify Operator
        const opUser = mockDb.getUsers().find(u => u.operatorId === ticket.assignment?.operatorId);
        if (opUser) {
          notifs.unshift({
            notificationId: notifs.length + 1,
            userId: opUser.userId,
            title: 'Yêu cầu làm lại công việc (Rework)',
            message: `Kết quả xử lý phản ánh "${ticket.title}" chưa đạt yêu cầu. Chi tiết: ${note}`,
            type: 'ReworkRequested',
            isRead: false,
            targetUrl: `/provider/tickets/${feedbackId}`,
            createdAt: new Date().toISOString()
          });
        }
      }

      mockDb.updateTickets(tickets);
      mockDb.updateNotifications(notifs);
      mockDb.addAudit(staffUserId, isApproved ? 'Approve Resolution' : 'Reject Resolution/Rework', 'Feedback', feedbackId);

      // Save status history
      const history = mockDb.get('urbanmind_history') || [];
      history.unshift({
        historyId: history.length + 1,
        feedbackId,
        changedByUserId: staffUserId,
        oldStatus,
        newStatus: ticket.status,
        note: isApproved ? 'Nhân viên tiếp nhận duyệt chất lượng xử lý.' : `Yêu cầu làm lại: ${note}`,
        changedAt: new Date().toISOString()
      });
      mockDb.set('urbanmind_history', history);

      return ticket;
    });
  },

  // Resident rating review
  submitReview(feedbackId, userId, rating, isSatisfied, comment) {
    return apiClient.request(() => {
      const tickets = mockDb.getTickets();
      const ticket = tickets.find(t => t.feedbackId === feedbackId);
      if (!ticket) throw new Error('Không tìm thấy phản ánh.');

      const oldStatus = ticket.status;
      ticket.status = 'Closed';
      ticket.updatedAt = new Date().toISOString();

      ticket.reviews.push({
        reviewId: Date.now(),
        userId,
        rating: Number(rating),
        isSatisfied: Boolean(isSatisfied),
        comment,
        createdAt: new Date().toISOString()
      });

      // Simple sentiment update based on rating
      ticket.sentiment = rating >= 4 ? 'Positive' : (rating === 3 ? 'Neutral' : 'Negative');

      mockDb.updateTickets(tickets);
      mockDb.addAudit(userId, 'Submit CSAT Review', 'Feedback', feedbackId, { oldStatus }, { status: 'Closed', rating });

      // Save status history
      const history = mockDb.get('urbanmind_history') || [];
      history.unshift({
        historyId: history.length + 1,
        feedbackId,
        changedByUserId: userId,
        oldStatus,
        newStatus: 'Closed',
        note: `Người dân gửi đánh giá dịch vụ (${rating} sao). Đóng hồ sơ phản ánh sự cố.`,
        changedAt: new Date().toISOString()
      });
      mockDb.set('urbanmind_history', history);

      return ticket;
    });
  },

  getHistory(feedbackId) {
    const history = mockDb.get('urbanmind_history') || [];
    return Promise.resolve(history.filter(h => h.feedbackId === feedbackId));
  }
};
