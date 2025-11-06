import { useState } from 'react';
import { roomApi } from '../../api/roomApi';
import type { RoomCreateRequest } from '../../types/room';
import './CreateRoomModal.css';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}

export function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
  const [title, setTitle] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const request: RoomCreateRequest = {
        title: title.trim() || undefined,
        isAnonymous,
      };

      const response = await roomApi.createRoom(request);
      onSuccess(response.roomId);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '방 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setIsAnonymous(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">새 방 생성</h2>
          <button className="modal-close" type="button" onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="room-title">방 제목</label>
            <input
              id="room-title"
              type="text"
              placeholder="방 제목을 입력하세요 (선택사항)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span>익명으로 생성</span>
              <span className="checkbox-description">
                (다른 참가자들에게 "익명"으로 표시됩니다)
              </span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              취소
            </button>
            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? '생성 중...' : '생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

