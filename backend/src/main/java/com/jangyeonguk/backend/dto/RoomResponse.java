package com.jangyeonguk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private UUID roomId;
    private String title;
    private UUID ownerId;
    private String ownerName; // owner가 있으면 displayName, 없으면 "익명"
    private OffsetDateTime createdAt;
    private OffsetDateTime lastUpdatedAt;
    private Integer participantCount; // 방 참여자 수
}

