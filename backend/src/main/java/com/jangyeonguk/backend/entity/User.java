package com.jangyeonguk.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    private UUID userId; // 1. UUID 타입의 사용자 아이디(ID 랜덤 생성 및 무단 사용 방지)
    // 2. JPA가 INSERT Query 발생 시 자동으로 할당
    
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email; // 이메일
    
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash; // 비밀번호 해시
    
    @Column(name = "display_name", length = 100)
    private String displayName; // 닉네임
    
    @CreationTimestamp // Hibernate가 INSERT Query 발생 시 자동으로 할당
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt; // 생성일시(시간대 오프셋을 포함해, PostgreSQL와 잘 매팽됨)
}

