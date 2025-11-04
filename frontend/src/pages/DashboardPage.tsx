import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { RoomCard } from '../components/room/RoomCard';
import { CreateRoomModal } from '../components/room/CreateRoomModal';
import { authApi } from '../api/authApi';
import { roomApi } from '../api/roomApi';
import type { RoomResponse } from '../types/room';
import './DashboardPage.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 방 목록 조회
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const roomsData = await roomApi.getAllRooms();
        setRooms(roomsData);
      } catch (err) {
        console.error('방 목록 조회 실패:', err);
        setError(err instanceof Error ? err.message : '방 목록을 가져오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleCreateRoom = (roomId: string, roomUrl: string) => {
    // 방 생성 성공 시 방 페이지로 이동
    navigate(`/rooms/${roomId}`);
  };

  const handleRoomClick = (roomId: string) => {
    navigate(`/rooms/${roomId}`);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      // 로그아웃 성공 시 로컬 스토리지에서 사용자 정보 제거
      localStorage.removeItem('user');
      // 로그인 페이지로 이동
      navigate('/auth');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 에러가 발생해도 로컬 스토리지 정리 및 로그인 페이지로 이동
      localStorage.removeItem('user');
      navigate('/auth');
    }
  };

  return (
    <div className="dashboard-page">
      <Header onLogout={handleLogout} />
      
      <main className="dashboard-main">
        <section className="recent-rooms-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">최근 방</h2>
              <p className="section-subtitle">공유 그림판에서 함께 작업하세요</p>
            </div>
            <button
              className="create-room-button"
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>새방 생성</span>
            </button>
          </div>

          <div className="rooms-container">
            {isLoading ? (
              <div className="empty-state">
                <p>방 목록을 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <p>오류: {error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    window.location.reload();
                  }}
                >
                  다시 시도
                </button>
              </div>
            ) : rooms.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <p>아직 생성된 방이 없습니다</p>
                <p className="empty-state-subtitle">새 방을 생성하여 시작하세요</p>
              </div>
            ) : (
              <div className="rooms-grid">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.roomId}
                    room={room}
                    onClick={() => handleRoomClick(room.roomId)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <button className="help-button" type="button" aria-label="도움말">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateRoom}
      />
    </div>
  );
}

