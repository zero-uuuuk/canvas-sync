package com.jangyeonguk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIImageConversionResponse {
    private UUID conversionId; // 변환 작업 ID
    private String status; // 변환 상태 (PENDING, PROCESSING, COMPLETED, FAILED)
    private String message; // 상태 메시지
}

