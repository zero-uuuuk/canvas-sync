package com.jangyeonguk.backend.repository;

import com.jangyeonguk.backend.entity.RoomParticipant;
import com.jangyeonguk.backend.entity.RoomParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, RoomParticipantId> {
    /**
     * 사용자 ID와 방 ID로 참가자 조회
     */
    Optional<RoomParticipant> findById_UserIdAndId_RoomId(UUID userId, UUID roomId);
    
    /**
     * 사용자가 방에 참가 중인지 확인
     */
    boolean existsById_UserIdAndId_RoomId(UUID userId, UUID roomId);
    
    /**
     * 사용자 ID로 참여한 방 목록 조회
     * 방의 최근 업데이트 순서로 정렬
     */
    @Query("SELECT rp FROM RoomParticipant rp WHERE rp.id.userId = :userId ORDER BY rp.room.lastUpdatedAt DESC")
    List<RoomParticipant> findById_UserIdOrderByRoom_LastUpdatedAtDesc(@Param("userId") UUID userId);
    
    /**
     * 여러 방의 참여자 수를 한 번에 조회
     * @param roomIds 방 ID 목록
     * @return 방 ID를 키로, 참여자 수를 값으로 하는 Map
     */
    @Query("SELECT rp.id.roomId, COUNT(rp) FROM RoomParticipant rp WHERE rp.id.roomId IN :roomIds GROUP BY rp.id.roomId")
    List<Object[]> countParticipantsByRoomIds(@Param("roomIds") List<UUID> roomIds);
    
    /**
     * 여러 방의 참여자 수를 Map 형태로 반환하는 헬퍼 메서드
     */
    default Map<UUID, Long> getParticipantCountsByRoomIds(List<UUID> roomIds) {
        if (roomIds == null || roomIds.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        List<Object[]> results = countParticipantsByRoomIds(roomIds);
        return results.stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));
    }
}

