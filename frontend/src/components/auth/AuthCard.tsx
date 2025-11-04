import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import './AuthCard.css';

type AuthMode = 'login' | 'signup';

export function AuthCard() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleLoginSuccess = (response: any) => {
    console.log('Login successful:', response);
    // 로그인 성공 후 사용자 정보 저장 및 대시보드로 이동
    localStorage.setItem('user', JSON.stringify(response));
    navigate('/dashboard');
  };

  const handleSignupSuccess = (response: any) => {
    console.log('Signup successful:', response);
    // 회원가입 성공 시 로그인 탭으로 이동
    setMode('login');
    setErrorMessage('');
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="auth-title">환영합니다</h1>
        <p className="auth-subtitle">계정에 로그인하거나 새 계정을 만드세요</p>
      </div>

      <div className="auth-tabs">
        <button
          className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => {
            setMode('login');
            setErrorMessage('');
          }}
        >
          로그인
        </button>
        <button
          className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
          onClick={() => {
            setMode('signup');
            setErrorMessage('');
          }}
        >
          회원가입
        </button>
      </div>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <div className="auth-content">
        {mode === 'login' ? (
          <LoginForm onLoginSuccess={handleLoginSuccess} onError={handleError} />
        ) : (
          <SignupForm onSignupSuccess={handleSignupSuccess} onError={handleError} />
        )}
      </div>

      <div className="social-login">
        <div className="divider">
          <span>또는</span>
        </div>
        <div className="social-buttons">
          <button className="social-button" type="button">
            Google
          </button>
          <button className="social-button" type="button">
            GitHub
          </button>
        </div>
      </div>
    </div>
  );
}

