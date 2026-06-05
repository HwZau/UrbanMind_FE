// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { mockDb } from './store/mockStore';

function App() {
  useEffect(() => {
    // Initialize mock database in localStorage
    mockDb.init();
    
    // Set default theme to light if not set
    const savedTheme = localStorage.getItem('urbanmind_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
