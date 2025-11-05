package com.jangyeonguk.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invitation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "invitation_id")
    private UUID invitationId; // UUID 타입의 초대 아이디
    
    @Column(name = "token", nullable = false, unique = true, length = 255)
    private String token; // 고유 초대 토큰
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, foreignKey = @ForeignKey(name = "fk_invitation_room"))
    private Room room; // 초대된 방
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inviter_id", nullable = false, foreignKey = @ForeignKey(name = "fk_invitation_inviter"))
    private User inviter; // 초대한 사용자
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private InvitationStatus status = InvitationStatus.PENDING; // 초대 상태
    
    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt; // 만료 시간
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt; // 생성일시
    
    public enum InvitationStatus {
        PENDING,    // 대기 중
        EXPIRED     // 만료됨
    }
}

