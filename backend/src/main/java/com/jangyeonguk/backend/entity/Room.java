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
    @JoinColumn(name = "owner_id", nullable = true, foreignKey = @ForeignKey(name = "fk_room_owner")) // 방장(Owner) 외래키 제약조건 추가
    private User owner; // 방장(Owner), 익명 생성 시 null
    
    @Column(name = "title", length = 255)
    private String title; // 방 제목
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt; // 생성일시
    
    @UpdateTimestamp // Hibernate가 UPDATE + INSERT Query 발생 시 자동으로 할당
    @Column(name = "last_updated_at", nullable = false)
    private OffsetDateTime lastUpdatedAt; // 마지막 업데이트 일시
}

