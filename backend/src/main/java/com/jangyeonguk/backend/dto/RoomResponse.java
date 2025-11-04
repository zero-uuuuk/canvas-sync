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
    private OffsetDateTime createdAt;
    private OffsetDateTime lastUpdatedAt;
}

