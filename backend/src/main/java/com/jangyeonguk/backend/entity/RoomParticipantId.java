package com.jangyeonguk.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Embeddable // Embeddable 타입의 클래스는 Serializable 인터페이스를 구현해야 함, 복합 기본키는 Embedded로 구현됨.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode // 객체 비교 시 사용자 아이디와 방 아이디를 비교하여 같은 객체인지 확인(클래스 고유값이 아니라)
public class RoomParticipantId implements Serializable {
    
    @Column(name = "user_id")
    private UUID userId; // 사용자 아이디
    
    @Column(name = "room_id")
    private UUID roomId; // 방 아이디
}

