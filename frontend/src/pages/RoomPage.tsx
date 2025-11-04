import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomApi } from '../api/roomApi';
import { canvasApi } from '../api/canvasApi';
import type { RoomResponse } from '../types/room';
import type { CanvasObjectResponse, LineObjectData } from '../types/canvas';
import './RoomPage.css';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Canvas 관련 상태
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<CanvasObjectResponse[]>([]);

  // 방 정보 및 캔버스 객체 로드
  useEffect(() => {
    if (!roomId) {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [roomData, objectsData] = await Promise.all([
          roomApi.getRoom(roomId),
          canvasApi.getCanvasObjects(roomId),
        ]);
        setRoom(roomData);
        setCanvasObjects(objectsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '방 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [roomId, navigate]);

  // 캔버스 렌더링 함수
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 기존 캔버스 객체 렌더링
    canvasObjects.forEach((obj) => {
      if (obj.objectType === 'line') {
        try {
          const lineData: LineObjectData = JSON.parse(obj.objectData);
          ctx.beginPath();
          ctx.moveTo(lineData.x1, lineData.y1);
          ctx.lineTo(lineData.x2, lineData.y2);
          ctx.strokeStyle = lineData.color || '#000000';
          ctx.lineWidth = lineData.strokeWidth || 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        } catch (e) {
          console.error('Failed to parse line data:', e);
        }
      }
    });

    // 현재 그리기 중인 line 렌더링
    if (isDrawing && startPos && currentPos) {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = '#4a9eff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, [canvasObjects, isDrawing, startPos, currentPos]);

  // 캔버스 크기 조정 및 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeAndRender = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newWidth = Math.floor(rect.width);
      const newHeight = Math.floor(rect.height);

      // 크기가 변경되었을 때만 업데이트
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
      }

      // 렌더링 실행
      requestAnimationFrame(renderCanvas);
    };

    // 초기 설정
    resizeAndRender();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', resizeAndRender);

    // ResizeObserver를 사용하여 컨테이너 크기 변경 감지
    const resizeObserver = new ResizeObserver(() => {
      resizeAndRender();
    });

    const container = canvas.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      window.removeEventListener('resize', resizeAndRender);
      resizeObserver.disconnect();
    };
  }, [renderCanvas]);

  // 캔버스 객체 또는 드로잉 상태 변경 시 렌더링
  useEffect(() => {
    requestAnimationFrame(renderCanvas);
  }, [renderCanvas]);

  // 마우스 이벤트 핸들러
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return null;

    const rect = canvas.getBoundingClientRect();
    // CSS 크기와 실제 canvas 크기의 비율 계산
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // 마우스 좌표를 canvas 좌표로 변환
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoordinates(e);
    if (!pos) return;

    setIsDrawing(true);
    setStartPos(pos);
    setCurrentPos(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getCanvasCoordinates(e);
    if (!pos) return;

    setCurrentPos(pos);
    // 즉시 렌더링하여 드래그 중 선이 매끄럽게 표시되도록 함
    requestAnimationFrame(renderCanvas);
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !currentPos || !roomId) return;

    const pos = getCanvasCoordinates(e);
    if (!pos) return;

    // Line 데이터 생성
    const lineData: LineObjectData = {
      x1: startPos.x,
      y1: startPos.y,
      x2: pos.x,
      y2: pos.y,
      color: '#4a9eff',
      strokeWidth: 2,
    };

    try {
      // 백엔드에 저장
      const newObject = await canvasApi.createCanvasObject(roomId, {
        objectType: 'line',
        objectData: JSON.stringify(lineData),
      });

      // 상태 업데이트
      setCanvasObjects((prev) => [...prev, newObject]);
    } catch (err) {
      console.error('Failed to save canvas object:', err);
    } finally {
      setIsDrawing(false);
      setStartPos(null);
      setCurrentPos(null);
    }
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setStartPos(null);
      setCurrentPos(null);
    }
  };

  // Undo 핸들러
  const handleUndo = async () => {
    if (!roomId || canvasObjects.length === 0) return;

    try {
      await canvasApi.undoCanvasObject(roomId);
      // 캔버스 객체 목록 다시 불러오기
      const objectsData = await canvasApi.getCanvasObjects(roomId);
      setCanvasObjects(objectsData);
    } catch (err) {
      console.error('Failed to undo canvas object:', err);
      alert(err instanceof Error ? err.message : 'Undo에 실패했습니다.');
    }
  };

  // Redo 핸들러
  const handleRedo = async () => {
    if (!roomId) return;

    try {
      await canvasApi.redoCanvasObject(roomId);
      // 캔버스 객체 목록 다시 불러오기
      const objectsData = await canvasApi.getCanvasObjects(roomId);
      setCanvasObjects(objectsData);
    } catch (err) {
      console.error('Failed to redo canvas object:', err);
      // 복구할 객체가 없을 때는 에러 메시지를 표시하지 않음 (정상적인 경우)
      if (err instanceof Error && err.message.includes('복구할')) {
        // 조용히 처리 (사용자에게 알림 불필요)
        return;
      }
      alert(err instanceof Error ? err.message : 'Redo에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="room-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>방 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="room-page">
        <div className="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>방을 찾을 수 없습니다</h2>
          <p>{error || '방 정보를 불러올 수 없습니다.'}</p>
          <button className="btn-back" type="button" onClick={() => navigate('/dashboard')}>
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-page">
      <header className="room-header">
        <button className="back-button" type="button" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          <span>돌아가기</span>
        </button>
        <div className="room-info">
          <h1 className="room-title">{room.title}</h1>
          <p className="room-meta">
            생성자: {room.ownerName} · {new Date(room.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div className="action-buttons">
          <button
            className="undo-button"
            type="button"
            onClick={handleUndo}
            disabled={canvasObjects.length === 0}
            title="가장 최근에 그린 선을 삭제합니다"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
            <span>Undo</span>
          </button>
          <button
            className="redo-button"
            type="button"
            onClick={handleRedo}
            title="가장 최근에 삭제한 선을 복구합니다"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
            </svg>
            <span>Redo</span>
          </button>
        </div>
      </header>

      <main className="room-canvas">
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            className="canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      </main>
    </div>
  );
}

