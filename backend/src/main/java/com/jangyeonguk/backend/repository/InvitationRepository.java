package com.jangyeonguk.backend.repository;

import com.jangyeonguk.backend.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    /**
     * 토큰으로 초대 조회
     */
    Optional<Invitation> findByToken(String token);
    
    /**
     * 방 ID로 초대 목록 조회
     */
    java.util.List<Invitation> findByRoom_RoomId(UUID roomId);
}

