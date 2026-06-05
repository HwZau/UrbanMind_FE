// src/services/api/apiClient.js
import { tokenStorage } from '../storage/tokenStorage';

// Simulated response latency in ms
const LATENCY = 400;

export const apiClient = {
  request(action, isPublic = false) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const token = tokenStorage.getToken();
        
        // Simulating JWT verification
        if (!isPublic && !token) {
          return reject({ status: 401, message: 'Unauthorized access. Token missing.' });
        }
        
        try {
          const result = action();
          resolve(result);
        } catch (error) {
          reject({ status: 500, message: error.message || 'Server error' });
        }
      }, LATENCY);
    });
  }
};
