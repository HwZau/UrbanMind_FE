// src/services/api/authApi.js
import { apiClient } from './apiClient';
import { mockDb } from '../../store/mockStore';
import { tokenStorage } from '../storage/tokenStorage';

export const authApi = {
  login(email, password) {
    return apiClient.request(() => {
      const users = mockDb.getUsers();
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('Email không tồn tại trong hệ thống.');
      }
      if (user.passwordHash !== password) {
        throw new Error('Mật khẩu không chính xác.');
      }
      if (!user.isActive) {
        throw new Error('Tài khoản của bạn hiện đang bị khóa.');
      }

      // Generate a mock JWT token (mock string)
      const token = `mock-jwt-token-for-${user.role}-${user.userId}`;
      tokenStorage.setToken(token);
      tokenStorage.setUser(user);
      
      mockDb.addAudit(user.userId, 'Login', 'User', user.userId);
      return { token, user };
    }, true);
  },

  register(fullName, email, password, phoneNumber, address) {
    return apiClient.request(() => {
      const users = mockDb.getUsers();
      const existing = users.find(u => u.email === email);
      if (existing) {
        throw new Error('Email này đã được sử dụng.');
      }

      const newUser = {
        userId: `u-${Date.now()}`,
        fullName,
        email,
        passwordHash: password,
        phoneNumber,
        address,
        role: 'service-user', // default registration is citizen
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
        isActive: true,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      mockDb.updateUsers(users);
      mockDb.addAudit(newUser.userId, 'Register', 'User', newUser.userId);
      return { success: true, message: 'Đăng ký thành công! Đang chuyển hướng xác thực OTP.' };
    }, true);
  },

  verifyOtp(email, otpCode) {
    return apiClient.request(() => {
      // Simulating successful OTP verification for any 6 digit code
      if (!otpCode || otpCode.length !== 6) {
        throw new Error('Mã OTP không hợp lệ. Phải gồm 6 chữ số.');
      }
      
      const users = mockDb.getUsers();
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('Email xác thực không tồn tại.');
      }
      
      return { success: true, message: 'Xác thực OTP thành công!' };
    }, true);
  },

  logout() {
    const user = tokenStorage.getUser();
    if (user) {
      mockDb.addAudit(user.userId, 'Logout', 'User', user.userId);
    }
    tokenStorage.clear();
    return Promise.resolve({ success: true });
  },

  getCurrentUser() {
    return Promise.resolve(tokenStorage.getUser());
  }
};
