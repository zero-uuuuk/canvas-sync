import { useState } from 'react';
import type { InvitationCreateResponse } from '../../types/room';
import './InvitationLinkModal.css';

interface InvitationLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: InvitationCreateResponse | null;
}

export function InvitationLinkModal({ isOpen, onClose, invitation }: InvitationLinkModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invitation) return null;

  const fullUrl = `${window.location.origin}${invitation.invitationUrl}`;
  const expiresAt = new Date(invitation.expiresAt);
  const formattedExpiresAt = expiresAt.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: select text
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="invitation-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">초대 링크 생성됨</h2>
          <button className="modal-close" type="button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="invitation-modal-body">
          <p className="invitation-description">
            아래 링크를 복사하여 원하는 사용자에게 전송하세요.
          </p>

          <div className="invitation-link-container">
            <input
              type="text"
              readOnly
              value={fullUrl}
              className="invitation-link-input"
            />
            <button
              type="button"
              className="btn-copy"
              onClick={handleCopy}
              title="링크 복사"
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>복사됨!</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>복사</span>
                </>
              )}
            </button>
          </div>

          <div className="invitation-info">
            <div className="info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>만료 시간: {formattedExpiresAt}</span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-close" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

