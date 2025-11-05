package com.jangyeonguk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CanvasObjectUpdateRequest {
    private String objectData; // 업데이트할 객체 데이터 (JSON 문자열)
}

