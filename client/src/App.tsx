import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useAppSettings } from './contexts/SettingsContext';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { AccountSettings } from './pages/AccountSettings';
import { Friends } from './pages/Friends';
import { Lobby } from './pages/Lobby';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ color: 'var(--sub-color)' }}>Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppContent() {
  const { settings } = useAppSettings();
  return (
    <>
      <Header />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/account" element={
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        } />
        <Route path="/friends" element={
          <ProtectedRoute>
            <Friends />
          </ProtectedRoute>
        } />
        <Route path="/lobby/:lobbyId" element={
          <ProtectedRoute>
            <Lobby />
          </ProtectedRoute>
        } />
      </Routes>

      <footer style={{ marginTop: 'auto', padding: '2rem 0', color: 'var(--sub-color)', fontSize: '0.9rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <span><i className="fas fa-code"></i> github</span>
        <span><i className="fas fa-palette"></i> theme: {settings.theme}</span>
        <span><i className="fas fa-code-branch"></i> v1.0.0</span>
      </footer>
    </>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
