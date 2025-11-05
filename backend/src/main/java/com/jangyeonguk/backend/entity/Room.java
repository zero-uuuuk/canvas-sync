package com.jangyeonguk.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "room_id")
    private UUID roomId; // UUID 타입의 방 아이디
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false, foreignKey = @ForeignKey(name = "fk_room_owner"))
    private User owner; // 방장(Owner), 모든 방은 사용자와 연결됨
    
    @Column(name = "title", length = 255)
    private String title; // 방 제목
    
    @Column(name = "is_anonymous", nullable = false)
    @Builder.Default
    private Boolean isAnonymous = false; // 익명 여부, true면 다른 참가자들에게 "익명"으로 표시
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt; // 생성일시
    
    @UpdateTimestamp // Hibernate가 UPDATE + INSERT Query 발생 시 자동으로 할당
    @Column(name = "last_updated_at", nullable = false)
    private OffsetDateTime lastUpdatedAt; // 마지막 업데이트 일시
}

