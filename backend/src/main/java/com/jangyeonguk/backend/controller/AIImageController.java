package com.jangyeonguk.backend.controller;

import com.jangyeonguk.backend.dto.AIImageConversionRequest;
import com.jangyeonguk.backend.dto.AIImageConversionResponse;
import com.jangyeonguk.backend.service.AIImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/rooms/{roomId}/ai-image-conversion")
@RequiredArgsConstructor
public class AIImageController {
    
    private final AIImageService aiImageService;
    
    /**
     * 선택된 객체들을 AI 이미지로 변환 요청
     * 
     * @param roomId 방 ID
     * @param request 변환 요청 (선택된 객체 ID 목록, 프롬프트)
     * @return 변환 응답 (변환 ID, 상태, 메시지)
     */
    @PostMapping
    public ResponseEntity<AIImageConversionResponse> convertToImage(
            @PathVariable UUID roomId,
            @RequestBody AIImageConversionRequest request) {
        AIImageConversionResponse response = aiImageService.convertToImage(roomId, request);
        return ResponseEntity.ok(response);
    }
}

