package com.jangyeonguk.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "canvas_objects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanvasObject {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "object_id")
    private UUID objectId; // UUID 타입의 캔버스 객체 아이디
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, foreignKey = @ForeignKey(name = "fk_canvas_object_room"))
    private Room room; // 방
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false, foreignKey = @ForeignKey(name = "fk_canvas_object_creator"))
    private User creator; // 생성자
    
    @Column(name = "object_type", nullable = false, length = 50)
    private String objectType; // "line", "text", "circle", etc.
    // mvp는 line만 사용
    
    @JdbcTypeCode(SqlTypes.JSON) // 이 필드를 JSON 타입으로 처리하도록 지시
    @Column(name = "object_data", nullable = false, columnDefinition = "jsonb") // JSONB 타입으로 저장(검증 자동, 인덱싱 최적화, JSON 쿼리 가능)
    private String objectData;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default // 빌더로 명시하지 않을 경우, 기본값을 false로 설정
    private Boolean isDeleted = false;
}

