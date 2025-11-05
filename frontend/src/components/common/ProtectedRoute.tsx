import { Navigate } from 'react-router-dom';
import { hasToken } from '../../utils/tokenStorage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * 토큰이 없으면 로그인 페이지로 리다이렉트
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!hasToken()) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

