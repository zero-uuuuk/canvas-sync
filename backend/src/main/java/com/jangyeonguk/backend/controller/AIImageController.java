package com.jangyeonguk.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jangyeonguk.backend.dto.AIImageConversionRequest;
import com.jangyeonguk.backend.dto.AIImageConversionResponse;
import com.jangyeonguk.backend.service.AIImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms/{roomId}/ai-image-conversion")
@RequiredArgsConstructor
public class AIImageController {
    
    private final AIImageService aiImageService;
    private final ObjectMapper objectMapper;
    
    /**
     * 선택된 객체들을 AI 이미지로 변환 요청
     * 
     * @param roomId 방 ID
     * @param selectedObjectIds 선택된 객체 ID 목록 (JSON 문자열)
     * @param prompt 프롬프트
     * @param image 선택 영역 이미지 파일
     * @return 변환 응답 (변환 ID, 상태, 메시지)
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<AIImageConversionResponse> convertToImage(
            @PathVariable UUID roomId,
            @RequestParam("selectedObjectIds") String selectedObjectIdsJson,
            @RequestParam("prompt") String prompt,
            @RequestParam("image") MultipartFile image) {
        
        try {
            // JSON 문자열을 List<UUID>로 변환
            List<UUID> selectedObjectIds = objectMapper.readValue(
                selectedObjectIdsJson, 
                new TypeReference<List<UUID>>() {}
            );
            
            AIImageConversionRequest request = AIImageConversionRequest.builder()
                    .selectedObjectIds(selectedObjectIds)
                    .prompt(prompt)
                    .image(image)
                    .build();
            
        AIImageConversionResponse response = aiImageService.convertToImage(roomId, request);
        return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new IllegalArgumentException("요청 파라미터를 파싱할 수 없습니다: " + e.getMessage());
        }
    }
}

