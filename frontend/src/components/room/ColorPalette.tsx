import { useState, useRef, useEffect } from 'react';
import './ColorPalette.css';

interface ColorPaletteProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

// 미리 정의된 색상 목록
const PRESET_COLORS = [
  '#000000', // 검은색
  '#ffffff', // 흰색
  '#ff0000', // 빨간색
  '#00ff00', // 초록색
  '#0000ff', // 파란색
  '#ffff00', // 노란색
  '#ff00ff', // 마젠타
  '#00ffff', // 시안
  '#ffa500', // 주황색
  '#800080', // 보라색
  '#ffc0cb', // 분홍색
  '#a52a2a', // 갈색
  '#808080', // 회색
  '#008000', // 다크 그린
  '#000080', // 네이비
];

export function ColorPalette({ selectedColor, onColorChange }: ColorPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');
  const paletteRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 팔레트 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePresetColorClick = (color: string) => {
    onColorChange(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorChange(color);
  };

  return (
    <div className="color-palette-container" ref={paletteRef}>
      <button
        className="color-palette-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="색상 선택"
      >
        <div
          className="color-preview"
          style={{ backgroundColor: selectedColor }}
        />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="color-palette-dropdown">
          <div className="preset-colors">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className={`preset-color-button ${selectedColor === color ? 'active' : ''}`}
                type="button"
                onClick={() => handlePresetColorClick(color)}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="custom-color-section">
            <label className="custom-color-label">커스텀 색상</label>
            <div className="custom-color-input-wrapper">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="custom-color-input"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    onColorChange(value);
                    setCustomColor(value);
                  }
                }}
                className="color-hex-input"
                placeholder="#000000"
                maxLength={7}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

