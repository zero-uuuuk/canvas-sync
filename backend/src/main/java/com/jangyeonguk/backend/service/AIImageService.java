package com.jangyeonguk.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jangyeonguk.backend.dto.AIImageConversionRequest;
import com.jangyeonguk.backend.dto.AIImageConversionResponse;
import com.jangyeonguk.backend.entity.CanvasObject;
import com.jangyeonguk.backend.entity.Room;
import com.jangyeonguk.backend.entity.User;
import com.jangyeonguk.backend.exception.RoomNotFoundException;
import com.jangyeonguk.backend.repository.CanvasObjectRepository;
import com.jangyeonguk.backend.repository.RoomRepository;
import com.jangyeonguk.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AIImageService {
    
    private final RoomRepository roomRepository;
    private final CanvasObjectRepository canvasObjectRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;
    
    /**
     * 선택된 객체들을 AI 이미지로 변환 요청
     * 
     * @param roomId 방 ID
     * @param request 변환 요청 (선택된 객체 ID 목록, 프롬프트, 이미지)
     * @return 변환 응답 (변환 ID, 상태, 메시지)
     */
    @Transactional
    public AIImageConversionResponse convertToImage(UUID roomId, AIImageConversionRequest request) {
        // 방 존재 여부 확인
        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
        
        // 선택된 객체 ID 목록 검증
        if (request.getSelectedObjectIds() == null || request.getSelectedObjectIds().isEmpty()) {
            throw new IllegalArgumentException("선택된 객체가 없습니다.");
        }
        
        // 프롬프트 검증
        if (request.getPrompt() == null || request.getPrompt().trim().isEmpty()) {
            throw new IllegalArgumentException("프롬프트를 입력해주세요.");
        }
        
        // 이미지 파일 검증
        if (request.getImage() == null || request.getImage().isEmpty()) {
            throw new IllegalArgumentException("이미지 파일이 없습니다.");
        }
        
        // 선택된 객체들이 해당 방에 속하는지 확인
        List<CanvasObject> selectedObjects = canvasObjectRepository.findAllById(request.getSelectedObjectIds());
        
        for (CanvasObject obj : selectedObjects) {
            if (!obj.getRoom().getRoomId().equals(roomId)) {
                throw new IllegalArgumentException("선택된 객체 중 해당 방에 속하지 않은 객체가 있습니다.");
            }
            if (obj.getIsDeleted()) {
                throw new IllegalArgumentException("선택된 객체 중 삭제된 객체가 있습니다.");
            }
        }
        
        // 변환 작업 ID 생성
        UUID conversionId = UUID.randomUUID();
        
        try {
            // AI 서비스 호출
            String aiResponse = callAIService(request.getImage(), request.getPrompt());
            
            // AI 응답에서 Base64 이미지 추출
            JsonNode responseJson = objectMapper.readTree(aiResponse);
            String base64Image = responseJson.path("image_data").asText();
            
            if (base64Image == null || base64Image.isEmpty()) {
                throw new RuntimeException("AI 서비스에서 이미지 데이터를 받지 못했습니다.");
            }
            
            // Base64 이미지를 디코딩하여 크기 계산
            int width = 0;
            int height = 0;
            try {
                byte[] imageBytes = Base64.getDecoder().decode(base64Image);
                BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(imageBytes));
                if (bufferedImage != null) {
                    width = bufferedImage.getWidth();
                    height = bufferedImage.getHeight();
                }
            } catch (Exception e) {
                // 이미지 크기 계산 실패 시 기본값 유지
                // 로그는 남기지 않음 (선택 사항)
            }
            
            Map<String, Object> imageData = new HashMap<>();
            imageData.put("imageData", base64Image);
            imageData.put("width", width);
            imageData.put("height", height);
            
            // 현재 인증된 사용자 조회
            UUID currentUserId = getCurrentUserId();
            User creator = userRepository.findByUserId(currentUserId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + currentUserId));
            
            // 변환된 이미지를 CanvasObject로 저장
            CanvasObject imageObject = CanvasObject.builder()
                    .room(room)
                    .creator(creator)
                    .objectType("image")
                    .objectData(objectMapper.writeValueAsString(imageData))
                    .isDeleted(false)
                    .build();
            
            canvasObjectRepository.save(imageObject);
        
        return AIImageConversionResponse.builder()
                .conversionId(conversionId)
                    .status("COMPLETED")
                    .message("이미지 변환이 완료되었습니다.")
                    .build();
                    
        } catch (Exception e) {
            return AIImageConversionResponse.builder()
                    .conversionId(conversionId)
                    .status("FAILED")
                    .message("이미지 변환에 실패했습니다: " + e.getMessage())
                .build();
        }
    }
    
    /**
     * AI 서비스를 호출하여 이미지 변환
     */
    private String callAIService(MultipartFile imageFile, String prompt) throws IOException {
        // multipart/form-data 요청 생성
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("prompt", prompt);
        body.add("image", imageFile.getResource());
        
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        
        // AI 서비스 URL
        String url = aiServiceUrl + "/api/generate/image-to-image";
        
        // AI 서비스 호출
        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                requestEntity,
                String.class
        );
        
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("AI 서비스 호출 실패: " + response.getStatusCode());
        }
        
        return response.getBody();
    }
    
    /**
     * 헬퍼 메서드: 현재 인증된 사용자의 userId 추출
     */
    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("인증이 필요합니다. 로그인 후 다시 시도해주세요.");
        }
        
        String principal = authentication.getPrincipal().toString();
        try {
            return UUID.fromString(principal);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("유효하지 않은 사용자 인증 정보입니다.");
        }
    }
}

