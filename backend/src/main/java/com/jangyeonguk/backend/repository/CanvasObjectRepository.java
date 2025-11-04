package com.jangyeonguk.backend.repository;

import com.jangyeonguk.backend.entity.CanvasObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CanvasObjectRepository extends JpaRepository<CanvasObject, UUID> {
    /**
     * 방 ID로 캔버스 객체 목록 조회 (삭제되지 않은 것만)
     */
    List<CanvasObject> findByRoom_RoomIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID roomId);
    
    /**
     * 방 ID로 가장 최근에 생성된 캔버스 객체 조회 (삭제되지 않은 것만)
     */
    Optional<CanvasObject> findFirstByRoom_RoomIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID roomId);
    
    /**
     * 방 ID로 가장 최근에 삭제된 캔버스 객체 조회 (삭제된 것만)
     */
    Optional<CanvasObject> findFirstByRoom_RoomIdAndIsDeletedTrueOrderByCreatedAtDesc(UUID roomId);
}

