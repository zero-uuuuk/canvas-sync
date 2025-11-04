import { AuthCard } from '../components/auth/AuthCard';
import './AuthPage.css';

export function AuthPage() {
  return (
    <div className="auth-page">
      <AuthCard />
      
      <footer className="auth-footer">
        <p className="copyright">© 2025 All rights reserved</p>
        <button className="help-button" type="button" aria-label="도움말">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
      </footer>
    </div>
  );
}

