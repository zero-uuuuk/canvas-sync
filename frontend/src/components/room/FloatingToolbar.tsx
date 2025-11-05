import { useState } from 'react';
import { ColorPalette } from './ColorPalette';
import './FloatingToolbar.css';

interface FloatingToolbarProps {
  drawingMode: 'line' | 'path' | 'eraser' | 'select';
  onDrawingModeChange: (mode: 'line' | 'path' | 'eraser' | 'select') => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  eraserSize: number;
  onEraserSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
}

export function FloatingToolbar({
  drawingMode,
  onDrawingModeChange,
  selectedColor,
  onColorChange,
  eraserSize,
  onEraserSizeChange,
  onUndo,
  onRedo,
  canUndo,
}: FloatingToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`floating-toolbar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        className="toolbar-toggle"
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? '접기' : '펼치기'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          {isExpanded ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M12 3v18" />
          )}
        </svg>
      </button>

      {isExpanded && (
        <div className="toolbar-content">
          <div className="tool-selection">
            <button
              className={`tool-button ${drawingMode === 'select' ? 'active' : ''}`}
              type="button"
              onClick={() => onDrawingModeChange('select')}
              title="선택 및 이동"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              </svg>
              <span>선택</span>
            </button>
            <button
              className={`tool-button ${drawingMode === 'line' ? 'active' : ''}`}
              type="button"
              onClick={() => onDrawingModeChange('line')}
              title="선 그리기"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
              <span>선</span>
            </button>
            <button
              className={`tool-button ${drawingMode === 'path' ? 'active' : ''}`}
              type="button"
              onClick={() => onDrawingModeChange('path')}
              title="자유로운 경로"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12c0 1.5 1 2 2 2s2-.5 2-2c0-1 0-2 2-2s2 1 2 2c0 1.5 1 2 2 2s2-.5 2-2c0-1 0-2 2-2s2 1 2 2c0 1.5 1 2 2 2s2-.5 2-2" />
              </svg>
              <span>경로</span>
            </button>
            <button
              className={`tool-button ${drawingMode === 'eraser' ? 'active' : ''}`}
              type="button"
              onClick={() => onDrawingModeChange('eraser')}
              title="지우개"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="6" y2="15" />
              </svg>
              <span>지우개</span>
            </button>
          </div>

          {drawingMode === 'eraser' && (
            <div className="eraser-size-control">
              <label className="eraser-size-label">지우개 크기: {eraserSize}px</label>
              <input
                type="range"
                min="10"
                max="100"
                value={eraserSize}
                onChange={(e) => onEraserSizeChange(Number(e.target.value))}
                className="eraser-size-slider"
              />
            </div>
          )}

          {drawingMode !== 'eraser' && drawingMode !== 'select' && (
            <ColorPalette
              selectedColor={selectedColor}
              onColorChange={onColorChange}
            />
          )}

          <div className="toolbar-actions">
            <button
              className="toolbar-action-button undo-button"
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="가장 최근에 그린 객체를 삭제합니다"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
              <span>Undo</span>
            </button>
            <button
              className="toolbar-action-button redo-button"
              type="button"
              onClick={onRedo}
              title="가장 최근에 삭제한 객체를 복구합니다"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
              </svg>
              <span>Redo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

