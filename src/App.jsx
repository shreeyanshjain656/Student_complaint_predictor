import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import StudentDashboard from './components/StudentDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import HodDashboard from './components/HodDashboard';
import Unauthorized from './components/Unauthorized';
import { Button, Toast } from './components/UI';

export default function App() {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('scp_token');
    return saved ? JSON.parse(saved) : null;
  });
  const [route, setRoute] = useState('');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleHashChange = () => {
      const hashVal = window.location.hash.replace(/^#\/?/, '');
      setRoute(hashVal);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('scp_token', JSON.stringify(newToken));
    setToken(newToken);
    const defaultRoute = `${newToken.role.toLowerCase()}-dashboard`;
    window.location.hash = `/${defaultRoute}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('scp_token');
    setToken(null);
    window.location.hash = '';
  };

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const resolveView = () => {
    if (!token) return <Auth onLoginSuccess={handleLoginSuccess} addToast={addToast} />;
    if (!route) {
      const defaultDashboard = `${token.role.toLowerCase()}-dashboard`;
      window.location.hash = `/${defaultDashboard}`;
      return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-500 font-semibold animate-pulse">Routing to dashboard...</div>;
    }
    if (route === 'student-dashboard') {
      if (token.role === 'Student') return <StudentDashboard token={token} onLogout={handleLogout} addToast={addToast} />;
      return <Unauthorized userRole={token.role} onGoBack={() => window.location.hash = `/${token.role.toLowerCase()}-dashboard`} />;
    }
    if (route === 'faculty-dashboard') {
      if (token.role === 'Faculty') return <FacultyDashboard token={token} onLogout={handleLogout} addToast={addToast} />;
      return <Unauthorized userRole={token.role} onGoBack={() => window.location.hash = `/${token.role.toLowerCase()}-dashboard`} />;
    }
    if (route === 'hod-dashboard') {
      if (token.role === 'HOD') return <HodDashboard token={token} onLogout={handleLogout} addToast={addToast} />;
      return <Unauthorized userRole={token.role} onGoBack={() => window.location.hash = `/${token.role.toLowerCase()}-dashboard`} />;
    }
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-white text-sm font-bold">404 - Page Not Found</h2>
        <Button onClick={() => window.location.hash = `/${token.role.toLowerCase()}-dashboard`} variant="primary" size="sm">Return to Dashboard</Button>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>
      {resolveView()}
    </div>
  );
}
