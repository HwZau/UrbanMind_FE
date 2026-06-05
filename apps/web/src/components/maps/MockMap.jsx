// src/components/maps/MockMap.jsx
import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { mockDb } from '../../store/mockStore';

// Boundaries representing central Ho Chi Minh City (District 1)
const LAT_MIN = 10.7600;
const LAT_MAX = 10.7800;
const LNG_MIN = 106.6900;
const LNG_MAX = 106.7100;

export const MockMap = ({ isInteractive = false, onSelectLocation = null, highlightTicketId = null }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedPos, setSelectedPos] = useState(null);
  const [hoveredTicket, setHoveredTicket] = useState(null);
  const [mapType, setMapType] = useState('vector'); // 'vector' or 'satellite'

  const width = 800;
  const height = 450;

  useEffect(() => {
    // Read current tickets
    setTickets(mockDb.getTickets());
  }, []);

  // Map coordinates (lat/lng) to SVG (x/y)
  const getXY = (lat, lng) => {
    const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * width;
    // SVGs draw from top-left, so invert Y axis
    const y = (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * height;
    return { x, y };
  };

  // Map SVG (x/y) to coordinates (lat/lng)
  const getLatLng = (x, y) => {
    const lng = LNG_MIN + (x / width) * (LNG_MAX - LNG_MIN);
    const lat = LAT_MIN + (1 - y / height) * (LAT_MAX - LAT_MIN);
    return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
  };

  // Convert ticket status to pin color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return '#ef4444'; // Red
      case 'AI Reviewed': return '#a855f7'; // Purple
      case 'Assigned': return '#3b82f6'; // Blue
      case 'InProgress': return '#f59e0b'; // Orange
      case 'Resolved': return '#10b981'; // Green
      case 'Closed': return '#6b7280'; // Grey
      default: return '#3b82f6';
    }
  };

  const handleMapClick = (e) => {
    if (!isInteractive) return;

    // Get click coordinates relative to the SVG container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    const coords = getLatLng(x, y);
    setSelectedPos({ x, y, ...coords });

    // Reverse geocode simulation
    let address = 'Vị trí đã chọn trên bản đồ';
    if (x < 300 && y < 200) address = 'Khu vực Công viên Tào Đàn, Quận 1, TP. HCM';
    else if (x > 500 && y < 200) address = 'Khu đô thị mới Lê Lợi, Bến Nghé, Quận 1, TP. HCM';
    else if (x > 400 && y > 300) address = 'Gần Cầu Khánh Hội, Quận 4, TP. HCM';
    else if (x < 400 && y > 300) address = 'Đường Bùi Viện, Phạm Ngũ Lão, Quận 1, TP. HCM';
    else address = 'Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. HCM';

    if (onSelectLocation) {
      onSelectLocation(coords.lat, coords.lng, address);
    }
  };

  return (
    <div className="relative w-full border border-base-300 rounded-2xl overflow-hidden bg-slate-900 shadow-lg">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button 
          onClick={() => setMapType('vector')} 
          className={`btn btn-xs rounded-lg font-bold border-none ${
            mapType === 'vector' ? 'btn-primary' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          Vector
        </button>
        <button 
          onClick={() => setMapType('satellite')} 
          className={`btn btn-xs rounded-lg font-bold border-none ${
            mapType === 'satellite' ? 'btn-primary' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          Vệ tinh
        </button>
      </div>

      {/* SVG Canvas Map */}
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-auto cursor-crosshair select-none"
        onClick={handleMapClick}
      >
        {/* Background / Satellite grid simulation */}
        {mapType === 'satellite' ? (
          <rect width={width} height={height} fill="#0d1b2a" />
        ) : (
          <rect width={width} height={height} fill="#1e293b" />
        )}

        {/* River (Saigon River simulation) */}
        <path 
          d="M 580 0 Q 640 180 520 300 T 700 450 L 800 450 L 800 0 Z" 
          fill={mapType === 'satellite' ? '#1b263b' : '#38bdf8'} 
          opacity={mapType === 'satellite' ? '0.6' : '0.25'} 
        />

        {/* Parks */}
        {/* Tao Dan Park */}
        <rect x="80" y="80" width="160" height="120" rx="10" fill="#15803d" opacity="0.3" />
        <text x="160" y="145" textAnchor="middle" className="text-[10px] fill-emerald-400 font-bold opacity-70">Công viên Tao Đàn</text>

        {/* September 23 Park */}
        <rect x="50" y="320" width="280" height="40" rx="8" fill="#15803d" opacity="0.3" />
        <text x="190" y="345" textAnchor="middle" className="text-[10px] fill-emerald-400 font-bold opacity-70">Công viên 23/9</text>

        {/* Streets Grid */}
        <g stroke="#ffffff" strokeOpacity="0.15" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
          {/* Le Loi Street */}
          <line x1="100" y1="200" x2="600" y2="200" />
          {/* Nguyen Hue */}
          <line x1="500" y1="50" x2="500" y2="380" />
          {/* Ham Nghi */}
          <line x1="350" y1="280" x2="650" y2="280" />
          {/* Vo Van Kiet */}
          <path d="M 50 400 L 550 400 L 750 450" />
          {/* Bui Vien */}
          <line x1="50" y1="360" x2="350" y2="260" />
        </g>

        {/* Street Labels */}
        <g className="text-[8px] font-bold fill-slate-400 pointer-events-none select-none">
          <text x="320" y="195" transform="rotate(0 320 195)">Đại lộ Lê Lợi</text>
          <text x="495" y="130" transform="rotate(90 495 130)">Đường Nguyễn Huệ</text>
          <text x="510" y="275">Đường Hàm Nghi</text>
          <text x="150" y="395">Đại lộ Võ Văn Kiệt</text>
          <text x="210" y="300" transform="rotate(-18 210 300)">Phố Bùi Viện</text>
        </g>

        {/* Interactive Selected Location Pin (For Flow 1) */}
        {selectedPos && (
          <g>
            {/* Glow ring */}
            <circle cx={selectedPos.x} cy={selectedPos.y} r="15" fill="#ef4444" opacity="0.25" className="animate-ping" />
            <circle cx={selectedPos.x} cy={selectedPos.y} r="5" fill="#ef4444" />
            {/* Target Crosshair */}
            <path d={`M ${selectedPos.x - 12} ${selectedPos.y} L ${selectedPos.x + 12} ${selectedPos.y} M ${selectedPos.x} ${selectedPos.y - 12} L ${selectedPos.x} ${selectedPos.y + 12}`} stroke="#ef4444" strokeWidth="2" />
          </g>
        )}

        {/* Pre-populated Ticket Pins on the map */}
        {tickets.map((t, idx) => {
          if (!t.latitude || !t.longitude) return null;
          const { x, y } = getXY(t.latitude, t.longitude);
          const color = getStatusColor(t.status);
          const isHighlighted = highlightTicketId === t.feedbackId;

          return (
            <g 
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredTicket({ ...t, x, y })}
              onMouseLeave={() => setHoveredTicket(null)}
            >
              {/* Highlight Ring */}
              {isHighlighted && (
                <circle cx={x} cy={y} r="18" fill="transparent" stroke="#a855f7" strokeWidth="2" strokeDasharray="3 3" className="animate-spin" />
              )}
              {/* Ping Animation for unresolved issues */}
              {t.status !== 'Closed' && t.status !== 'Resolved' && (
                <circle cx={x} cy={y} r="12" fill={color} opacity="0.3" className="animate-pulse" />
              )}
              
              {/* Main Pin Dot */}
              <circle 
                cx={x} 
                cy={y} 
                r={isHighlighted ? 7 : 5} 
                fill={color} 
                stroke="#ffffff" 
                strokeWidth="1.5" 
                className="hover:scale-125 transition-transform" 
              />
            </g>
          );
        })}
      </svg>

      {/* Interactive instruction HUD */}
      {isInteractive && (
        <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white text-[10px] p-2.5 rounded-xl border border-slate-700 flex flex-col gap-1 backdrop-blur-md">
          <div className="flex items-center gap-1.5 font-bold">
            <Lucide.Compass className="text-primary animate-spin" size={12} />
            <span>Định vị GPS Sự Cố</span>
          </div>
          <span className="text-gray-400">Click vào bất kỳ điểm nào trên bản đồ để ghim tọa độ.</span>
          {selectedPos && (
            <span className="text-primary font-bold">
              Tọa độ: {selectedPos.lat}, {selectedPos.lng}
            </span>
          )}
        </div>
      )}

      {/* Live Ticket Hover Tooltip Cards */}
      {hoveredTicket && (
        <div 
          className="absolute bg-base-100 border border-base-300 p-3 rounded-xl shadow-xl w-60 z-30 pointer-events-none transition-all duration-200"
          style={{
            left: Math.min(hoveredTicket.x + 15, width - 250),
            top: Math.min(hoveredTicket.y - 40, height - 120)
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-base-300 pb-1.5 mb-1.5">
            <span className="text-[9px] font-bold text-gray-500">{hoveredTicket.feedbackId}</span>
            <span className={`badge badge-xs uppercase font-bold py-1.5 ${
              hoveredTicket.status === 'Resolved' || hoveredTicket.status === 'Closed' ? 'badge-success' : 'badge-error'
            }`}>
              {hoveredTicket.status}
            </span>
          </div>
          <h5 className="font-bold text-[11px] truncate">{hoveredTicket.title}</h5>
          <p className="text-[9px] text-gray-500 truncate mt-0.5">{hoveredTicket.locationText}</p>
          <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-base-200 text-[8px] font-bold">
            <span className="text-primary">Mức ưu tiên: {hoveredTicket.priority}</span>
            <span className="text-slate-400">|</span>
            <span>Sentiment: {hoveredTicket.sentiment}</span>
          </div>
        </div>
      )}
    </div>
  );
};
