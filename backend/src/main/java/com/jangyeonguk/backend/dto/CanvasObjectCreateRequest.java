package com.jangyeonguk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CanvasObjectCreateRequest {
    private String objectType; // "line", "text", "circle", etc.
    private String objectData; // JSON 문자열 (line의 경우: {"x1": 0, "y1": 0, "x2": 100, "y2": 100, "color": "#000000", "strokeWidth": 2})
}

