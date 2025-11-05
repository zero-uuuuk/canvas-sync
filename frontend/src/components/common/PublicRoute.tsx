import { Navigate } from 'react-router-dom';
import { hasToken } from '../../utils/tokenStorage';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * 이미 로그인한 사용자가 접근할 수 없는 공개 라우트
 * 토큰이 있으면 대시보드로 리다이렉트
 */
export function PublicRoute({ children }: PublicRouteProps) {
  if (hasToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

