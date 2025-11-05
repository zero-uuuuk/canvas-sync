import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomApi } from '../api/roomApi';
import { canvasApi } from '../api/canvasApi';
import type { RoomResponse, InvitationCreateResponse } from '../types/room';
import type { CanvasObjectResponse, LineObjectData } from '../types/canvas';
import { InvitationLinkModal } from '../components/room/InvitationLinkModal';
import './RoomPage.css';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // 초대 링크 관련 상태
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [invitation, setInvitation] = useState<InvitationCreateResponse | null>(null);
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  
  // Canvas 관련 상태
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<CanvasObjectResponse[]>([]);
  const recentlyCreatedObjectIdsRef = useRef<Set<string>>(new Set()); // 자신이 방금 생성한 객체 ID 추적

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

  // 캔버스 객체 실시간 동기화 (Polling)
  useEffect(() => {
    if (!roomId || isLoading) return;

    const pollCanvasObjects = async () => {
      try {
        const objectsData = await canvasApi.getCanvasObjects(roomId);
        
        // 객체 ID 비교하여 변경사항만 업데이트
        setCanvasObjects((prev) => {
          // 현재 로컬에 있는 객체 ID 집합
          const prevObjectIds = new Set(prev.map(obj => obj.objectId));
          // 서버에서 받은 객체 ID 집합
          const newObjectIds = new Set(objectsData.map(obj => obj.objectId));
          
          // 객체 개수가 다르거나 새 객체가 있으면 업데이트
          const hasChanges = prevObjectIds.size !== newObjectIds.size || 
              ![...newObjectIds].every(id => prevObjectIds.has(id));
          
          if (hasChanges) {
            // 서버 데이터를 기준으로 업데이트
            // 자신이 방금 생성한 객체는 서버에 저장되면 polling에서 자동으로 받아옴
            // 최근 생성한 객체 ID 추적은 5초 후 자동으로 정리됨
            return objectsData;
          }
          
          return prev; // 변경사항이 없으면 이전 상태 유지
        });
      } catch (err) {
        console.error('Failed to poll canvas objects:', err);
        // 에러 발생 시에도 polling은 계속 진행
      }
    };

    // 2.5초마다 polling 실행
    const intervalId = setInterval(pollCanvasObjects, 2500);

    // 초기 polling 실행
    pollCanvasObjects();

    // 컴포넌트 언마운트 시 정리
    return () => {
      clearInterval(intervalId);
      recentlyCreatedObjectIdsRef.current.clear();
    };
  }, [roomId, isLoading]);

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

      // 최근 생성한 객체 ID 추적 (polling에서 중복 방지)
      recentlyCreatedObjectIdsRef.current.add(newObject.objectId);

      // 상태 업데이트 (자신이 그린 객체는 즉시 반영)
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
      // Polling이 자동으로 업데이트하므로 수동으로 불러오지 않음
      // 필요시 즉시 업데이트를 위해 호출할 수도 있음
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
      // Polling이 자동으로 업데이트하므로 수동으로 불러오지 않음
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

  // 초대 링크 생성 핸들러
  const handleCreateInvitation = async () => {
    if (!roomId) return;

    try {
      setIsCreatingInvitation(true);
      const invitationData = await roomApi.createInvitation(roomId);
      setInvitation(invitationData);
      setIsInvitationModalOpen(true);
    } catch (err) {
      console.error('Failed to create invitation:', err);
      alert(err instanceof Error ? err.message : '초대 링크 생성에 실패했습니다.');
    } finally {
      setIsCreatingInvitation(false);
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
            생성자: {room.ownerName} · 참여자 {room.participantCount}명 · {new Date(room.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div className="action-buttons">
          <button
            className="invite-button"
            type="button"
            onClick={handleCreateInvitation}
            disabled={isCreatingInvitation}
            title="초대 링크 생성"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            <span>{isCreatingInvitation ? '생성 중...' : '초대'}</span>
          </button>
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

      <InvitationLinkModal
        isOpen={isInvitationModalOpen}
        onClose={() => setIsInvitationModalOpen(false)}
        invitation={invitation}
      />
    </div>
  );
}

