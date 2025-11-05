package com.jangyeonguk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationCreateResponse {
    private UUID invitationId;
    private String invitationToken;
    private String invitationUrl; // 초대 링크 URL
    private java.time.OffsetDateTime expiresAt;
}

