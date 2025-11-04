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
public class CanvasObjectResponse {
    private UUID objectId;
    private UUID roomId;
    private UUID creatorId;
    private String objectType;
    private String objectData; // JSON 문자열
    private OffsetDateTime createdAt;
}

