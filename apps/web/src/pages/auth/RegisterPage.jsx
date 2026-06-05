// src/pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import * as Lucide from 'lucide-react';

export const RegisterPage = () => {
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Registration Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !phone) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(fullName, email, password, phone, address);
      // Success triggers OTP verification popup
      setShowOtpModal(true);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Mã OTP phải có độ dài đúng 6 ký số.');
      return;
    }
    setOtpError('');
    setOtpLoading(true);
    try {
      await verifyOtp(email, otpCode);
      setShowOtpModal(false);
      // Redirect to login page on success
      navigate('/login?success=1');
    } catch (err) {
      setOtpError(err.message || 'Mã xác nhận không đúng.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-base-200 via-base-300 to-primary/10 flex items-center justify-center p-6 font-sans">
      <div className="card w-full max-w-lg bg-base-100 border border-base-300 shadow-2xl p-8 rounded-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary text-primary-content">
              <Lucide.Cpu size={24} className="animate-pulse" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              UrbanMind
            </span>
          </Link>
          <h2 className="text-lg font-bold text-gray-500">ĐĂNG KÝ TÀI KHOẢN NGƯỜI DÂN</h2>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error text-xs font-semibold rounded-xl flex items-center gap-2 py-3 px-4">
            <Lucide.AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text font-bold text-xs">Họ và tên *</span>
            </label>
            <input 
              type="text" 
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input input-bordered w-full text-xs font-medium rounded-xl h-11"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-xs">Email liên lạc *</span>
            </label>
            <input 
              type="email" 
              placeholder="user@urbanmind.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full text-xs font-medium rounded-xl h-11"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-xs">Số điện thoại *</span>
            </label>
            <input 
              type="tel" 
              placeholder="09XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input input-bordered w-full text-xs font-medium rounded-xl h-11"
              required
            />
          </div>

          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text font-bold text-xs">Mật khẩu bảo mật *</span>
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-bordered w-full text-xs font-medium rounded-xl h-11"
              required
            />
          </div>

          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text font-bold text-xs">Địa chỉ thường trú (Không bắt buộc)</span>
            </label>
            <input 
              type="text" 
              placeholder="Số nhà, Tên đường, Phường/Quận..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input input-bordered w-full text-xs font-medium rounded-xl h-11"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary md:col-span-2 w-full rounded-xl font-bold shadow-lg shadow-primary/20 h-11 text-xs mt-2"
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner"></span> : 'ĐĂNG KÝ TÀI KHOẢN'}
          </button>
        </form>

        {/* Back to login */}
        <div className="text-center text-xs font-semibold text-gray-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary hover:underline font-bold">
            Đăng nhập tại đây
          </Link>
        </div>
      </div>

      {/* SIMULATED OTP VALIDATION MODAL DIALOG */}
      {showOtpModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl border border-base-300 max-w-sm p-6 text-center space-y-5">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Lucide.ShieldCheck size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base">Xác Thực Mã OTP</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                Một mã xác nhận OTP gồm 6 chữ số đã được gửi đến email <span className="font-bold text-base-content">{email}</span>. Vui lòng nhập mã để kích hoạt tài khoản.
              </p>
            </div>

            {otpError && (
              <div className="alert alert-error text-[10px] font-semibold py-2 px-3 rounded-lg flex gap-1.5 justify-center">
                <Lucide.AlertCircle size={14} />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleOtpVerify} className="space-y-4">
              <input 
                type="text" 
                maxLength="6"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g,''))}
                className="input input-bordered text-center text-lg font-black tracking-[0.5em] w-full rounded-xl h-12"
                required
              />
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowOtpModal(false)}
                  className="btn btn-sm btn-ghost flex-1 rounded-xl text-[10px]"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn btn-sm btn-primary flex-1 rounded-xl text-[10px]"
                  disabled={otpLoading}
                >
                  {otpLoading ? <span className="loading loading-spinner"></span> : 'XÁC NHẬN'}
                </button>
              </div>
            </form>

            <span className="text-[9px] text-gray-400 font-bold block">
              Mẹo: Nhập bất kỳ 6 chữ số nào (ví dụ: 123456) để mô phỏng thành công.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
