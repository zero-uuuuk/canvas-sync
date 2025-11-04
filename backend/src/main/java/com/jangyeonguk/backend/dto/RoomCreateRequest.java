package com.jangyeonguk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomCreateRequest {
    private String title;
    private Boolean isAnonymous; // true면 익명으로 생성 (다른 참가자들에게 "익명"으로 표시)
}

