package com.jangyeonguk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIImageConversionRequest {
    private List<UUID> selectedObjectIds; // 선택된 객체 ID 목록
    private String prompt; // 사용자가 입력한 프롬프트
}

