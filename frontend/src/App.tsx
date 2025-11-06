import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { RoomPage } from './pages/RoomPage';
import { AcceptInvitationPage } from './pages/AcceptInvitationPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicRoute } from './components/common/PublicRoute';
import { hasToken } from './utils/tokenStorage';
import './App.css';

function App() {
  return (
    <>
      <SpeedInsights />
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms/:roomId"
          element={
            <ProtectedRoute>
              <RoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invitations/:token/accept"
          element={
            <ProtectedRoute>
              <AcceptInvitationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={<Navigate to={hasToken() ? '/dashboard' : '/auth'} replace />}
        />
        <Route
          path="*"
          element={<Navigate to="/auth" replace />}
        />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
