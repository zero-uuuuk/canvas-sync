import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import './AuthCard.css';

type TabType = 'login' | 'signup';

export function AuthCard() {
  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLoginSuccess = (_response: any) => {
    setError(null);
    navigate('/dashboard');
  };

  const handleSignupSuccess = (_response: any) => {
    setError(null);
    // 회원가입 성공 후 로그인 탭으로 전환하거나 로그인 처리
    setActiveTab('login');
    setError('회원가입이 완료되었습니다. 로그인해주세요.');
  };

  const handleError = (message: string) => {
    setError(message);
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="auth-title">Canvas Sync</h1>
        <p className="auth-subtitle">협업을 위한 캔버스 공유 플랫폼</p>
      </div>

      <div className="auth-tabs">
        <button
          className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('login');
            setError(null);
          }}
        >
          로그인
        </button>
        <button
          className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('signup');
            setError(null);
          }}
        >
          회원가입
        </button>
      </div>

      <div className="auth-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {activeTab === 'login' ? (
          <LoginForm onLoginSuccess={handleLoginSuccess} onError={handleError} />
        ) : (
          <SignupForm onSignupSuccess={handleSignupSuccess} onError={handleError} />
        )}
      </div>
    </div>
  );
}

