import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomApi } from '../api/roomApi';
import { canvasApi } from '../api/canvasApi';
import type { RoomResponse, InvitationCreateResponse } from '../types/room';
import type { CanvasObjectResponse, LineObjectData, PathObjectData } from '../types/canvas';
import { InvitationLinkModal } from '../components/room/InvitationLinkModal';
import { FloatingToolbar } from '../components/room/FloatingToolbar';
import { AIImageConversionModal } from '../components/room/AIImageConversionModal';
import { aiImageApi } from '../api/aiImageApi';
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
  
  // AI 이미지 변환 관련 상태
  const [isAIImageModalOpen, setIsAIImageModalOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  
  // Canvas 관련 상태
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawingMode, setDrawingMode] = useState<'line' | 'path' | 'eraser' | 'select'>('line');
  const [selectedColor, setSelectedColor] = useState<string>('#000000'); // 기본 색상: 검은색
  const [eraserSize, setEraserSize] = useState<number>(20); // 지우개 크기 (기본값: 20픽셀)
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  const [canvasObjects, setCanvasObjects] = useState<CanvasObjectResponse[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null); // 마우스 위치 (지우개 영역 표시용)
  const [selectedObjectIds, setSelectedObjectIds] = useState<Set<string>>(new Set()); // 현재 선택된 객체 ID들
  const [isDragging, setIsDragging] = useState(false); // 객체를 드래그 중인지 여부
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null); // 드래그 시작 시 마우스와 객체의 오프셋
  const [draggedObjects, setDraggedObjects] = useState<Map<string, CanvasObjectResponse>>(new Map()); // 드래그 중인 객체들 (로컬 상태)
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null); // 선택 영역 (드래그 선택용)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null); // 드래그 시작 시 마우스 위치
  const [originalBoundingBox, setOriginalBoundingBox] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null); // 드래그 시작 시 원본 bounding box
  const recentlyCreatedObjectIdsRef = useRef<Set<string>>(new Set()); // 자신이 방금 생성한 객체 ID 추적
  const erasedObjectIdsRef = useRef<Set<string>>(new Set()); // 지우개로 삭제한 객체 ID 추적 (중복 삭제 방지)

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

  // 베지어 곡선 렌더링 함수
  const renderPathWithBezier = useCallback((
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    color: string = '#4a9eff',
    strokeWidth: number = 2
  ) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      // 점이 2개만 있으면 직선
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      // 3개 이상의 점을 부드러운 베지어 곡선으로 연결
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const current = points[i];
        
        if (i === 1) {
          // 첫 번째 세그먼트: 현재 점과 다음 점의 중간을 제어점으로 사용
          if (i + 1 < points.length) {
            const next = points[i + 1];
            const cpX = (current.x + next.x) / 2;
            const cpY = (current.y + next.y) / 2;
            ctx.quadraticCurveTo(current.x, current.y, cpX, cpY);
          } else {
            ctx.lineTo(current.x, current.y);
          }
        } else if (i === points.length - 1) {
          // 마지막 세그먼트: 이전 점을 제어점으로 사용
          ctx.quadraticCurveTo(prev.x, prev.y, current.x, current.y);
        } else {
          // 중간 세그먼트: 이전 점과 다음 점의 중간을 제어점으로 사용
          const next = points[i + 1];
          const cpX = (prev.x + next.x) / 2;
          const cpY = (prev.y + next.y) / 2;
          ctx.quadraticCurveTo(current.x, current.y, cpX, cpY);
        }
      }
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  // 캔버스 렌더링 함수
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 기존 캔버스 객체 렌더링 (드래그 중인 객체는 제외)
    canvasObjects.forEach((obj) => {
      // 드래그 중인 객체는 건너뛰기 (나중에 드래그된 위치에 렌더링)
      if (isDragging && draggedObjects.has(obj.objectId)) {
        return;
      }
      
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
          
          // 선택된 객체 하이라이트
          if (selectedObjectIds.has(obj.objectId) && !isDragging) {
            ctx.strokeStyle = '#0066ff';
            ctx.lineWidth = (lineData.strokeWidth || 2) + 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } catch (e) {
          console.error('Failed to parse line data:', e);
        }
      } else if (obj.objectType === 'path') {
        try {
          const pathData: PathObjectData = JSON.parse(obj.objectData);
          renderPathWithBezier(ctx, pathData.points, pathData.color, pathData.strokeWidth);
          
          // 선택된 객체 하이라이트
          if (selectedObjectIds.has(obj.objectId) && !isDragging) {
            ctx.strokeStyle = '#0066ff';
            ctx.lineWidth = pathData.strokeWidth + 2;
            ctx.setLineDash([5, 5]);
            renderPathWithBezier(ctx, pathData.points, '#0066ff', pathData.strokeWidth + 2);
            ctx.setLineDash([]);
          }
        } catch (e) {
          console.error('Failed to parse path data:', e);
        }
      }
    });
    
    // 드래그 중인 객체들을 실시간 위치에 렌더링
    if (isDragging && draggedObjects.size > 0) {
      draggedObjects.forEach((draggedObject) => {
        if (draggedObject.objectType === 'line') {
          try {
            const lineData: LineObjectData = JSON.parse(draggedObject.objectData);
            ctx.beginPath();
            ctx.moveTo(lineData.x1, lineData.y1);
            ctx.lineTo(lineData.x2, lineData.y2);
            ctx.strokeStyle = lineData.color || '#000000';
            ctx.lineWidth = lineData.strokeWidth || 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            
            // 드래그 중인 객체 하이라이트
            ctx.strokeStyle = '#0066ff';
            ctx.lineWidth = (lineData.strokeWidth || 2) + 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
          } catch (e) {
            console.error('Failed to parse dragged line data:', e);
          }
        } else if (draggedObject.objectType === 'path') {
          try {
            const pathData: PathObjectData = JSON.parse(draggedObject.objectData);
            renderPathWithBezier(ctx, pathData.points, pathData.color, pathData.strokeWidth);
            
            // 드래그 중인 객체 하이라이트
            ctx.strokeStyle = '#0066ff';
            ctx.lineWidth = pathData.strokeWidth + 2;
            ctx.setLineDash([5, 5]);
            renderPathWithBezier(ctx, pathData.points, '#0066ff', pathData.strokeWidth + 2);
            ctx.setLineDash([]);
          } catch (e) {
            console.error('Failed to parse dragged path data:', e);
          }
        }
      });
    }

    // 현재 그리기 중인 객체 렌더링
    if (isDrawing) {
      if (drawingMode === 'line' && startPos && currentPos) {
        // Line 모드: 시작점과 현재점을 연결하는 선
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      } else if (drawingMode === 'path' && currentPath.length > 0) {
        // Path 모드: 현재 경로를 베지어 곡선으로 렌더링
        renderPathWithBezier(ctx, currentPath, selectedColor, 2);
      }
    }

    // 지우개 모드일 때 지우개 영역 표시
    if (drawingMode === 'eraser') {
      const pos = isDrawing ? currentPos : mousePos;
      if (pos) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, eraserSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    
    // 선택된 객체들의 bounding box 테두리 렌더링
    if (selectedObjectIds.size > 0 && !isDragging) {
      const boundingBox = getSelectedObjectsBoundingBox();
      if (boundingBox) {
        const { minX, minY, maxX, maxY } = boundingBox;
        const width = maxX - minX;
        const height = maxY - minY;
        
        // 점선 사각형 테두리
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(minX, minY, width, height);
        ctx.setLineDash([]);
      }
    }
    
    // 선택 영역(사각형) 렌더링
    if (selectionBox) {
      const minX = Math.min(selectionBox.x1, selectionBox.x2);
      const maxX = Math.max(selectionBox.x1, selectionBox.x2);
      const minY = Math.min(selectionBox.y1, selectionBox.y2);
      const maxY = Math.max(selectionBox.y1, selectionBox.y2);
      
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      ctx.setLineDash([]);
      
      ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    }
  }, [canvasObjects, isDrawing, startPos, currentPos, currentPath, drawingMode, renderPathWithBezier, selectedColor, eraserSize, mousePos, selectedObjectIds, isDragging, draggedObjects, selectionBox]);

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

  // drawingMode가 'select'가 아닐 때 선택 해제
  useEffect(() => {
    if (drawingMode !== 'select' && selectedObjectIds.size > 0) {
      setSelectedObjectIds(new Set());
    }
  }, [drawingMode]);

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

  // 두 점 사이의 거리 계산
  const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // 선택된 객체들의 bounding box 계산
  const getSelectedObjectsBoundingBox = (): { minX: number; minY: number; maxX: number; maxY: number } | null => {
    if (selectedObjectIds.size === 0) return null;
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    selectedObjectIds.forEach((objectId) => {
      const obj = canvasObjects.find((o) => o.objectId === objectId);
      if (!obj) return;
      
      try {
        if (obj.objectType === 'line') {
          const lineData: LineObjectData = JSON.parse(obj.objectData);
          minX = Math.min(minX, lineData.x1, lineData.x2);
          minY = Math.min(minY, lineData.y1, lineData.y2);
          maxX = Math.max(maxX, lineData.x1, lineData.x2);
          maxY = Math.max(maxY, lineData.y1, lineData.y2);
        } else if (obj.objectType === 'path') {
          const pathData: PathObjectData = JSON.parse(obj.objectData);
          pathData.points.forEach((point) => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          });
        }
      } catch (e) {
        console.error('Failed to parse object data for bounding box:', e);
      }
    });
    
    if (minX === Infinity) return null;
    
    // 테두리 여유 공간 추가 (선택 표시를 위한 패딩)
    const padding = 5;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  };

  // 점이 사각형 테두리 위에 있는지 확인
  const isPointOnBoundingBoxBorder = (
    pos: { x: number; y: number },
    box: { minX: number; minY: number; maxX: number; maxY: number },
    threshold: number = 5
  ): boolean => {
    const { minX, minY, maxX, maxY } = box;
    
    // 상단 또는 하단 테두리
    if ((Math.abs(pos.y - minY) <= threshold || Math.abs(pos.y - maxY) <= threshold) &&
        pos.x >= minX - threshold && pos.x <= maxX + threshold) {
      return true;
    }
    
    // 좌측 또는 우측 테두리
    if ((Math.abs(pos.x - minX) <= threshold || Math.abs(pos.x - maxX) <= threshold) &&
        pos.y >= minY - threshold && pos.y <= maxY + threshold) {
      return true;
    }
    
    return false;
  };

  // 특정 위치에 있는 객체 찾기
  const getObjectAtPosition = (pos: { x: number; y: number }): CanvasObjectResponse | null => {
    const threshold = 5; // 선택 임계값 (픽셀)
    
    for (const obj of canvasObjects) {
      if (obj.objectType === 'line') {
        try {
          const lineData: LineObjectData = JSON.parse(obj.objectData);
          const p1 = { x: lineData.x1, y: lineData.y1 };
          const p2 = { x: lineData.x2, y: lineData.y2 };
          
          // 선분과 점의 최단 거리 계산
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          if (length === 0) {
            // 점인 경우
            const dist = getDistance(pos, p1);
            if (dist <= threshold) {
              return obj;
            }
          } else {
            // 선분인 경우
            const t = Math.max(0, Math.min(1, ((pos.x - p1.x) * dx + (pos.y - p1.y) * dy) / (length * length)));
            const closestPoint = {
              x: p1.x + t * dx,
              y: p1.y + t * dy,
            };
            
            const distToLine = getDistance(pos, closestPoint);
            if (distToLine <= threshold) {
              return obj;
            }
          }
        } catch (e) {
          console.error('Failed to parse line data:', e);
        }
      } else if (obj.objectType === 'path') {
        try {
          const pathData: PathObjectData = JSON.parse(obj.objectData);
          // 경로의 점들과 클릭한 점의 거리 확인
          for (const point of pathData.points) {
            const dist = getDistance(pos, point);
            if (dist <= threshold) {
              return obj;
            }
          }
        } catch (e) {
          console.error('Failed to parse path data:', e);
        }
      }
    }
    
    return null;
  };

  // 선택 영역과 객체 충돌 감지
  const checkSelectionBoxCollision = (
    box: { x1: number; y1: number; x2: number; y2: number },
    obj: CanvasObjectResponse
  ): boolean => {
    const minX = Math.min(box.x1, box.x2);
    const maxX = Math.max(box.x1, box.x2);
    const minY = Math.min(box.y1, box.y2);
    const maxY = Math.max(box.y1, box.y2);
    
    try {
      if (obj.objectType === 'line') {
        const lineData: LineObjectData = JSON.parse(obj.objectData);
        const p1 = { x: lineData.x1, y: lineData.y1 };
        const p2 = { x: lineData.x2, y: lineData.y2 };
        
        // 선분의 두 점이 모두 선택 영역 안에 있거나, 선분이 선택 영역과 교차하는지 확인
        const p1Inside = p1.x >= minX && p1.x <= maxX && p1.y >= minY && p1.y <= maxY;
        const p2Inside = p2.x >= minX && p2.x <= maxX && p2.y >= minY && p2.y <= maxY;
        
        if (p1Inside || p2Inside) {
          return true;
        }
        
        // 선분이 선택 영역과 교차하는지 확인 (간단한 체크: 선분의 두 점 중 하나라도 영역 안에 있으면 true)
        // 더 정확한 교차 검사는 필요시 추가 가능
        return false;
      } else if (obj.objectType === 'path') {
        const pathData: PathObjectData = JSON.parse(obj.objectData);
        // 경로의 점들 중 하나라도 선택 영역 안에 있으면 선택
        for (const point of pathData.points) {
          if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
            return true;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse object data for selection box collision:', e);
    }
    
    return false;
  };

  // 지우개 영역과 객체 충돌 감지
  const checkEraserCollision = (
    eraserCenter: { x: number; y: number },
    eraserRadius: number,
    obj: CanvasObjectResponse
  ): boolean => {
    try {
      if (obj.objectType === 'line') {
        const lineData: LineObjectData = JSON.parse(obj.objectData);
        // 선분의 각 점이 원 내부에 있는지 확인
        const p1 = { x: lineData.x1, y: lineData.y1 };
        const p2 = { x: lineData.x2, y: lineData.y2 };
        
        // 점이 원 내부에 있는지 확인
        const dist1 = getDistance(eraserCenter, p1);
        const dist2 = getDistance(eraserCenter, p2);
        
        if (dist1 <= eraserRadius || dist2 <= eraserRadius) {
          return true;
        }
        
        // 선분과 원의 최단 거리 계산
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) {
          return dist1 <= eraserRadius;
        }
        
        // 선분 위의 가장 가까운 점 찾기
        const t = Math.max(0, Math.min(1, ((eraserCenter.x - p1.x) * dx + (eraserCenter.y - p1.y) * dy) / (length * length)));
        const closestPoint = {
          x: p1.x + t * dx,
          y: p1.y + t * dy,
        };
        
        const distToLine = getDistance(eraserCenter, closestPoint);
        return distToLine <= eraserRadius;
      } else if (obj.objectType === 'path') {
        const pathData: PathObjectData = JSON.parse(obj.objectData);
        // 경로의 점들이 원 내부에 있는지 확인
        for (const point of pathData.points) {
          const dist = getDistance(eraserCenter, point);
          if (dist <= eraserRadius) {
            return true;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse object data for collision check:', e);
    }
    
    return false;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoordinates(e);
    if (!pos) return;

    if (drawingMode === 'select') {
      // 선택 모드: bounding box 테두리 또는 객체 찾기
      const boundingBox = getSelectedObjectsBoundingBox();
      const isOnBorder = boundingBox && isPointOnBoundingBoxBorder(pos, boundingBox);
      
      if (isOnBorder && selectedObjectIds.size > 0) {
        // 테두리를 클릭한 경우: 선택된 객체들을 드래그로 이동
        setIsDragging(true);
        setIsDrawing(true);
        setDragStartPos(pos); // 드래그 시작 위치 저장
        setOriginalBoundingBox(boundingBox); // 원본 bounding box 저장
        
        // 드래그 오프셋 계산 (bounding box의 중심점 기준)
        const centerX = (boundingBox.minX + boundingBox.maxX) / 2;
        const centerY = (boundingBox.minY + boundingBox.maxY) / 2;
        setDragOffset({ x: pos.x - centerX, y: pos.y - centerY });
        
        // 선택된 모든 객체들을 드래그 중인 객체로 복사
        const dragged = new Map<string, CanvasObjectResponse>();
        selectedObjectIds.forEach(id => {
          const obj = canvasObjects.find(o => o.objectId === id);
          if (obj) {
            dragged.set(id, { ...obj });
          }
        });
        setDraggedObjects(dragged);
      } else {
        // 객체 찾기
        const clickedObject = getObjectAtPosition(pos);
        if (clickedObject) {
          // 객체를 클릭한 경우: 다중 선택된 객체들을 드래그로 이동
          const isSelected = selectedObjectIds.has(clickedObject.objectId);
          
          if (!isSelected) {
            // 선택되지 않은 객체를 클릭한 경우: 기존 선택 해제하고 새로 선택
            setSelectedObjectIds(new Set([clickedObject.objectId]));
          }
          
          // 선택된 모든 객체들을 드래그로 이동 가능하도록 설정
          setIsDragging(true);
          setIsDrawing(true);
          setDragStartPos(pos); // 드래그 시작 위치 저장
          
          // 드래그 시작 시 원본 bounding box 저장
          const currentBoundingBox = getSelectedObjectsBoundingBox();
          if (currentBoundingBox) {
            setOriginalBoundingBox(currentBoundingBox);
          }
          
          // 드래그 오프셋 계산 (첫 번째 선택된 객체 기준)
          const firstSelectedObject = isSelected && selectedObjectIds.size > 0
            ? canvasObjects.find(obj => obj.objectId === Array.from(selectedObjectIds)[0])
            : clickedObject;
          
          if (firstSelectedObject) {
            try {
              if (firstSelectedObject.objectType === 'line') {
                const lineData: LineObjectData = JSON.parse(firstSelectedObject.objectData);
                const offsetX = pos.x - lineData.x1;
                const offsetY = pos.y - lineData.y1;
                setDragOffset({ x: offsetX, y: offsetY });
              } else if (firstSelectedObject.objectType === 'path') {
                const pathData: PathObjectData = JSON.parse(firstSelectedObject.objectData);
                if (pathData.points.length > 0) {
                  const firstPoint = pathData.points[0];
                  const offsetX = pos.x - firstPoint.x;
                  const offsetY = pos.y - firstPoint.y;
                  setDragOffset({ x: offsetX, y: offsetY });
                }
              }
            } catch (e) {
              console.error('Failed to parse object data for drag offset:', e);
            }
            
            // 선택된 모든 객체들을 드래그 중인 객체로 복사
            const dragged = new Map<string, CanvasObjectResponse>();
            selectedObjectIds.forEach(id => {
              const obj = canvasObjects.find(o => o.objectId === id);
              if (obj) {
                dragged.set(id, { ...obj });
              }
            });
            // 새로 선택한 객체도 추가
            if (!isSelected) {
              dragged.set(clickedObject.objectId, { ...clickedObject });
            }
            setDraggedObjects(dragged);
          }
        } else {
          // 빈 공간 클릭 시: 드래그로 선택 영역 그리기 시작
          setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
          setIsDrawing(true);
          setSelectedObjectIds(new Set()); // 기존 선택 해제
        }
      }
    } else {
    setIsDrawing(true);
      
      if (drawingMode === 'line') {
    setStartPos(pos);
    setCurrentPos(pos);
      } else if (drawingMode === 'path') {
        setCurrentPath([pos]);
      } else if (drawingMode === 'eraser') {
        setCurrentPos(pos);
        // 지우개 시작 시 삭제된 객체 ID 추적 초기화
        erasedObjectIdsRef.current.clear();
      }
    }
  };

  const handleMouseMove = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoordinates(e);
    if (!pos) return;

    // 지우개 모드일 때는 마우스 위치를 항상 추적
    if (drawingMode === 'eraser') {
      setMousePos(pos);
    }

    if (!isDrawing) {
      // 그리기 중이 아니어도 지우개 영역은 표시되도록 렌더링
      if (drawingMode === 'eraser') {
        requestAnimationFrame(renderCanvas);
      }
      return;
    }

    if (drawingMode === 'select') {
      if (selectionBox) {
        // 선택 영역 그리기 중: 선택 영역 업데이트
        setSelectionBox({ ...selectionBox, x2: pos.x, y2: pos.y });
        setCurrentPos(pos);
        requestAnimationFrame(renderCanvas);
        return;
      } else if (isDragging && draggedObjects.size > 0 && dragOffset && dragStartPos) {
        // 선택 모드에서 드래그 중: 다중 선택된 객체들 위치 업데이트
        // 마우스 이동량을 직접 계산하여 누적 오류 방지
        let deltaX = 0;
        let deltaY = 0;
        
        if (originalBoundingBox) {
          // 원본 bounding box 기준으로 드래그
          // 마우스 이동량만큼 객체 이동
          deltaX = pos.x - dragStartPos.x;
          deltaY = pos.y - dragStartPos.y;
        } else {
          // 객체 기준 드래그 (기존 로직)
          const firstSelectedId = Array.from(draggedObjects.keys())[0];
          const firstDraggedObject = draggedObjects.get(firstSelectedId);
          
          if (firstDraggedObject) {
            try {
              // 원본 객체의 위치를 기준으로 계산
              const originalObj = canvasObjects.find(o => o.objectId === firstSelectedId);
              if (originalObj) {
                if (originalObj.objectType === 'line') {
                  const originalLineData: LineObjectData = JSON.parse(originalObj.objectData);
                  const newX1 = pos.x - dragOffset.x;
                  const newY1 = pos.y - dragOffset.y;
                  deltaX = newX1 - originalLineData.x1;
                  deltaY = newY1 - originalLineData.y1;
                } else if (originalObj.objectType === 'path') {
                  const originalPathData: PathObjectData = JSON.parse(originalObj.objectData);
                  if (originalPathData.points.length > 0) {
                    const firstPoint = originalPathData.points[0];
                    const newFirstX = pos.x - dragOffset.x;
                    const newFirstY = pos.y - dragOffset.y;
                    deltaX = newFirstX - firstPoint.x;
                    deltaY = newFirstY - firstPoint.y;
                  }
                }
              }
            } catch (e) {
              console.error('Failed to calculate drag delta:', e);
            }
          }
        }
        
        // 모든 드래그 중인 객체들을 업데이트 (원본 객체 위치 기준)
        const updatedDragged = new Map<string, CanvasObjectResponse>();
        draggedObjects.forEach((obj, id) => {
          try {
            // 원본 객체를 canvasObjects에서 찾기
            const originalObj = canvasObjects.find(o => o.objectId === id);
            if (!originalObj) {
              updatedDragged.set(id, obj);
              return;
            }
            
            if (originalObj.objectType === 'line') {
              const originalLineData: LineObjectData = JSON.parse(originalObj.objectData);
              const updatedLineData: LineObjectData = {
                x1: originalLineData.x1 + deltaX,
                y1: originalLineData.y1 + deltaY,
                x2: originalLineData.x2 + deltaX,
                y2: originalLineData.y2 + deltaY,
                color: originalLineData.color,
                strokeWidth: originalLineData.strokeWidth,
              };
              updatedDragged.set(id, {
                ...originalObj,
                objectData: JSON.stringify(updatedLineData),
              });
            } else if (originalObj.objectType === 'path') {
              const originalPathData: PathObjectData = JSON.parse(originalObj.objectData);
              const updatedPoints = originalPathData.points.map((point) => ({
                x: point.x + deltaX,
                y: point.y + deltaY,
              }));
              const updatedPathData: PathObjectData = {
                points: updatedPoints,
                color: originalPathData.color,
                strokeWidth: originalPathData.strokeWidth,
              };
              updatedDragged.set(id, {
                ...originalObj,
                objectData: JSON.stringify(updatedPathData),
              });
            }
          } catch (e) {
            console.error('Failed to update dragged object:', e);
            updatedDragged.set(id, obj);
          }
        });
        setDraggedObjects(updatedDragged);
        setCurrentPos(pos);
        requestAnimationFrame(renderCanvas);
        return;
      }
    }

    if (drawingMode === 'line') {
    setCurrentPos(pos);
    } else if (drawingMode === 'path') {
      setCurrentPath((prev) => {
        if (prev.length === 0) {
          return [pos];
        }
        
        // 경로 최적화: 마지막 점과의 거리가 3픽셀 이상일 때만 추가
        const lastPoint = prev[prev.length - 1];
        const distance = getDistance(lastPoint, pos);
        
        if (distance >= 3) {
          return [...prev, pos];
        }
        
        return prev;
      });
    } else if (drawingMode === 'eraser' && roomId) {
      setCurrentPos(pos);
      
      // 지우개 영역과 겹치는 객체 찾기 및 삭제
      const eraserRadius = eraserSize;
      const objectsToDelete: string[] = [];
      
      canvasObjects.forEach((obj) => {
        // 이미 삭제된 객체는 건너뛰기
        if (erasedObjectIdsRef.current.has(obj.objectId)) {
          return;
        }
        
        if (checkEraserCollision(pos, eraserRadius, obj)) {
          objectsToDelete.push(obj.objectId);
        }
      });
      
      // 충돌하는 객체들을 삭제
      for (const objectId of objectsToDelete) {
        try {
          await canvasApi.deleteCanvasObject(roomId, objectId);
          erasedObjectIdsRef.current.add(objectId);
          
          // 로컬 상태에서도 제거
          setCanvasObjects((prev) => prev.filter((obj) => obj.objectId !== objectId));
        } catch (err) {
          console.error('Failed to delete canvas object:', err);
        }
      }
    }
    
    // 즉시 렌더링하여 드래그 중 선이 매끄럽게 표시되도록 함
    requestAnimationFrame(renderCanvas);
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getCanvasCoordinates(e);
    if (!pos) return;

    if (drawingMode === 'select') {
      if (selectionBox) {
        // 선택 영역으로 객체 선택
        const selectedIds = new Set<string>();
        canvasObjects.forEach((obj) => {
          if (checkSelectionBoxCollision(selectionBox, obj)) {
            selectedIds.add(obj.objectId);
          }
        });
        setSelectedObjectIds(selectedIds);
        setSelectionBox(null);
        setIsDrawing(false);
        setCurrentPos(null);
        return;
      } else if (isDragging && draggedObjects.size > 0 && roomId) {
        // 선택 모드에서 드래그 종료: 다중 선택된 객체들을 백엔드에 업데이트
        try {
          const updatePromises = Array.from(draggedObjects.entries()).map(([id, obj]) =>
            canvasApi.updateCanvasObject(roomId, id, {
              objectData: obj.objectData,
            })
          );
          
          await Promise.all(updatePromises);
          
          // 상태 업데이트: 드래그된 객체들을 canvasObjects에 반영
          setCanvasObjects((prev) =>
            prev.map((obj) => {
              const dragged = draggedObjects.get(obj.objectId);
              return dragged ? dragged : obj;
            })
          );
        } catch (err) {
          console.error('Failed to update canvas objects:', err);
        } finally {
          setIsDragging(false);
          setDraggedObjects(new Map());
          setDragOffset(null);
          setDragStartPos(null);
          setOriginalBoundingBox(null);
          setIsDrawing(false);
          setCurrentPos(null);
        }
        return;
      }
    }

    if (!roomId) return;

    try {
      if (drawingMode === 'line') {
        if (!startPos || !currentPos) return;

    // Line 데이터 생성
    const lineData: LineObjectData = {
      x1: startPos.x,
      y1: startPos.y,
      x2: pos.x,
      y2: pos.y,
      color: selectedColor,
      strokeWidth: 2,
    };

      // 백엔드에 저장
      const newObject = await canvasApi.createCanvasObject(roomId, {
        objectType: 'line',
        objectData: JSON.stringify(lineData),
      });

        // 최근 생성한 객체 ID 추적 (polling에서 중복 방지)
        recentlyCreatedObjectIdsRef.current.add(newObject.objectId);

        // 상태 업데이트 (자신이 그린 객체는 즉시 반영)
        setCanvasObjects((prev) => [...prev, newObject]);
      } else if (drawingMode === 'path') {
        // Path 데이터 생성
        const finalPath = [...currentPath];
        
        // 마지막 점이 현재 위치와 다르면 추가
        if (finalPath.length === 0 || 
            getDistance(finalPath[finalPath.length - 1], pos) >= 3) {
          finalPath.push(pos);
        }

        // 최소 2개 이상의 점이 있어야 저장
        if (finalPath.length >= 2) {
          const pathData: PathObjectData = {
            points: finalPath,
            color: selectedColor,
            strokeWidth: 2,
          };

          // 백엔드에 저장
          const newObject = await canvasApi.createCanvasObject(roomId, {
            objectType: 'path',
            objectData: JSON.stringify(pathData),
          });

          // 최근 생성한 객체 ID 추적 (polling에서 중복 방지)
          recentlyCreatedObjectIdsRef.current.add(newObject.objectId);

          // 상태 업데이트 (자신이 그린 객체는 즉시 반영)
      setCanvasObjects((prev) => [...prev, newObject]);
        }
      } else if (drawingMode === 'eraser') {
        // 지우개 모드는 handleMouseMove에서 처리하므로 여기서는 정리만
        erasedObjectIdsRef.current.clear();
      }
    } catch (err) {
      console.error('Failed to save canvas object:', err);
    } finally {
      setIsDrawing(false);
      setStartPos(null);
      setCurrentPos(null);
      setCurrentPath([]);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    if (isDrawing) {
      if (drawingMode === 'select') {
        if (selectionBox) {
          // 선택 영역 그리기 취소
          setSelectionBox(null);
          setIsDrawing(false);
          setCurrentPos(null);
        } else if (isDragging) {
          // 선택 모드에서 드래그 중일 때는 드래그 취소
          setIsDragging(false);
          setDraggedObjects(new Map());
          setDragOffset(null);
          setDragStartPos(null);
          setOriginalBoundingBox(null);
          setIsDrawing(false);
          setCurrentPos(null);
        }
      } else {
        setIsDrawing(false);
        setStartPos(null);
        setCurrentPos(null);
        setCurrentPath([]);
        if (drawingMode === 'eraser') {
          erasedObjectIdsRef.current.clear();
        }
      }
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

  // AI 이미지 변환 핸들러
  const handleAIImageConvert = async (prompt: string) => {
    if (!roomId || selectedObjectIds.size === 0) return;

    try {
      setIsConverting(true);
      const selectedIdsArray = Array.from(selectedObjectIds);
      const response = await aiImageApi.convertToImage(roomId, {
        selectedObjectIds: selectedIdsArray,
        prompt: prompt,
      });
      
      alert(`변환 요청이 접수되었습니다.\n변환 ID: ${response.conversionId}\n상태: ${response.status}\n${response.message}`);
      setIsAIImageModalOpen(false);
    } catch (err) {
      console.error('Failed to convert to AI image:', err);
      alert(err instanceof Error ? err.message : 'AI 이미지 변환에 실패했습니다.');
    } finally {
      setIsConverting(false);
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
          {selectedObjectIds.size > 0 && (
            <button
              className="ai-image-button"
              type="button"
              onClick={() => setIsAIImageModalOpen(true)}
              title="AI 이미지로 변환"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span>AI 이미지로 변환</span>
            </button>
          )}
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
        </div>
      </header>

      <main className="room-canvas">
        <div className="canvas-container">
          <FloatingToolbar
            drawingMode={drawingMode}
            onDrawingModeChange={setDrawingMode}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            eraserSize={eraserSize}
            onEraserSizeChange={setEraserSize}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canvasObjects.length > 0}
          />
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
      
      <AIImageConversionModal
        isOpen={isAIImageModalOpen}
        onClose={() => setIsAIImageModalOpen(false)}
        onConvert={handleAIImageConvert}
        isConverting={isConverting}
      />
    </div>
  );
}

