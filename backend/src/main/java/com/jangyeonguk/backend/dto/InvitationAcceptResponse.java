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
public class InvitationAcceptResponse {
    private UUID roomId;
    private String roomUrl; // 방 접속 URL
    private String message;
}

