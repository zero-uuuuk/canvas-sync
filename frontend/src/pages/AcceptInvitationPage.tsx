import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomApi } from '../api/roomApi';
import './AcceptInvitationPage.css';

type PageState = 'pending' | 'accepting' | 'error';

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>(() => {
    if (!token) {
      return 'error';
    }
    return 'pending';
  });
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!token) {
      setError('유효하지 않은 초대 링크입니다.');
      setState('error');
      return;
    }

    try {
      setState('accepting');
      setError(null);
      const response = await roomApi.acceptInvitation(token);
      // 성공 시 해당 방으로 리다이렉트
      navigate(`/rooms/${response.roomId}`, { replace: true });
    } catch (err) {
      console.error('초대 수락 실패:', err);
      setError(err instanceof Error ? err.message : '초대 수락에 실패했습니다.');
      setState('error');
    }
  };

  const handleReject = () => {
    navigate('/dashboard', { replace: true });
  };

  if (state === 'pending') {
    return (
      <div className="accept-invitation-page">
        <div className="confirmation-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h2>초대 수락</h2>
          <p>이 방에 참여하시겠습니까?</p>
          <div className="confirmation-buttons">
            <button
              className="btn-accept"
              type="button"
              onClick={handleAccept}
            >
              수락
            </button>
            <button
              className="btn-reject"
              type="button"
              onClick={handleReject}
            >
              거절
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'accepting') {
    return (
      <div className="accept-invitation-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>초대를 수락하는 중...</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="accept-invitation-page">
        <div className="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>초대 수락 실패</h2>
          <p>{error || '유효하지 않은 초대 링크입니다.'}</p>
          <button className="btn-back" type="button" onClick={() => navigate('/dashboard')}>
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}

