import { useState, useEffect, useRef } from 'react';
import './AIImageConversionModal.css';

interface AIImageConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (prompt: string) => Promise<void>;
  isConverting: boolean;
}

export function AIImageConversionModal({
  isOpen,
  onClose,
  onConvert,
  isConverting,
}: AIImageConversionModalProps) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isConverting) {
      await onConvert(prompt.trim());
    }
  };

  const handleCancel = () => {
    if (!isConverting) {
      setPrompt('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="ai-image-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">AI 이미지로 변환</h2>
          <button
            className="modal-close"
            type="button"
            onClick={handleCancel}
            disabled={isConverting}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="ai-image-modal-body" onSubmit={handleSubmit}>
          <div className="prompt-input-container">
            <label htmlFor="prompt-input" className="prompt-label">
              프롬프트를 입력하세요
            </label>
            <textarea
              id="prompt-input"
              ref={textareaRef}
              className="prompt-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 이 그림을 더 현실적으로 만들어주세요"
              disabled={isConverting}
              rows={5}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
              disabled={isConverting}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={!prompt.trim() || isConverting}
            >
              {isConverting ? '전송 중...' : '전송'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

