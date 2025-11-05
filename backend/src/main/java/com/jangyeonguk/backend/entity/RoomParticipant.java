package com.jangyeonguk.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "room_participants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomParticipant {
    
    @EmbeddedId 
    private RoomParticipantId id; // 1. 복합 기본키(Composite Primary Key) 사용
    // 2. 한 사용자(user)가 한 방(room)에 한 번만 동시에 참여할 수 있도록 제약조건 추가
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId") // 복합 기본키의 사용자 아이디 매핑
    @JoinColumn(name = "user_id", nullable = false, 
                foreignKey = @ForeignKey(name = "fk_participant_user"))
    private User user; // 사용자
    
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roomId") // 복합 기본키의 방 아이디 매핑
    @JoinColumn(name = "room_id", nullable = false, 
                foreignKey = @ForeignKey(name = "fk_participant_room"))
    private Room room; // 방
    
    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private OffsetDateTime joinedAt; // 참여일시
    
    @Column(name = "websocket_session_id", unique = true, length = 255)
    private String websocketSessionId; // WebSocket 세션 아이디
}

