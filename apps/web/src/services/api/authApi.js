// src/services/api/authApi.js
import { authApi as sharedAuthApi } from '@urbanmind/shared-api';
import { tokenStorage } from '../storage/tokenStorage';

const normalizeRole = (role) => {
  if (!role) return role;
  const normalized = String(role).trim().toLowerCase();
  if (normalized === 'serviceuser' || normalized === 'service-user') return 'service-user';
  if (normalized === 'systemstaff' || normalized === 'system-staff') return 'system-staff';
  if (normalized === 'serviceprovider' || normalized === 'service-provider') return 'service-provider';
  if (normalized === 'interactionmanager' || normalized === 'interaction-manager') return 'interaction-manager';
  if (normalized === 'systemadmin' || normalized === 'admin' || normalized === 'administrator') return 'administrator';
  return normalized;
};

export const authApi = {
  async login(email, password) {
    const response = await sharedAuthApi.login(email, password);
    const normalizedRole = normalizeRole(response.role);

    tokenStorage.setToken(response.token);
    tokenStorage.setUser({
      userId: response.userId,
      email: response.email,
      fullName: response.fullName,
      role: normalizedRole,
      isVerified: response.isVerified,
    });

    return {
      token: response.token,
      user: {
        userId: response.userId,
        email: response.email,
        fullName: response.fullName,
        role: normalizedRole,
        isVerified: response.isVerified,
      },
    };
  },

  async register(fullName, email, password, phone) {
    const response = await sharedAuthApi.register(fullName, email, password, phone);
    const normalizedRole = normalizeRole(response.role);

    tokenStorage.setToken(response.token);
    tokenStorage.setUser({
      userId: response.userId,
      email: response.email,
      fullName: response.fullName,
      role: normalizedRole,
      isVerified: response.isVerified,
    });

    return {
      token: response.token,
      user: {
        userId: response.userId,
        email: response.email,
        fullName: response.fullName,
        role: normalizedRole,
        isVerified: response.isVerified,
      },
    };
  },

  async googleLogin(idToken) {
    const response = await sharedAuthApi.googleLogin(idToken);
    const normalizedRole = normalizeRole(response.role);

    tokenStorage.setToken(response.token);
    tokenStorage.setUser({
      userId: response.userId,
      email: response.email,
      fullName: response.fullName,
      role: normalizedRole,
      isVerified: response.isVerified,
    });

    return {
      token: response.token,
      user: {
        userId: response.userId,
        email: response.email,
        fullName: response.fullName,
        role: normalizedRole,
        isVerified: response.isVerified,
      },
    };
  },

  async sendOTP() {
    await sharedAuthApi.sendOtp();
    return { success: true };
  },

  async verifyOTP(otp) {
    await sharedAuthApi.verifyOtp(otp);

    const user = tokenStorage.getUser();
    if (user) {
      user.isVerified = true;
      tokenStorage.setUser(user);
    }

    return { success: true };
  },

  async logout() {
    tokenStorage.clear();
    return { success: true };
  },

  async getCurrentUser() {
    return tokenStorage.getUser();
  },
};
