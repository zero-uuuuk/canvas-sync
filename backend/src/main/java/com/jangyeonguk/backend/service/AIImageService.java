package com.jangyeonguk.backend.service;

import com.jangyeonguk.backend.dto.AIImageConversionRequest;
import com.jangyeonguk.backend.dto.AIImageConversionResponse;
import com.jangyeonguk.backend.entity.CanvasObject;
import com.jangyeonguk.backend.exception.RoomNotFoundException;
import com.jangyeonguk.backend.repository.CanvasObjectRepository;
import com.jangyeonguk.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AIImageService {
    
    private final RoomRepository roomRepository;
    private final CanvasObjectRepository canvasObjectRepository;
    
    /**
     * 선택된 객체들을 AI 이미지로 변환 요청
     * 
     * @param roomId 방 ID
     * @param request 변환 요청 (선택된 객체 ID 목록, 프롬프트)
     * @return 변환 응답 (변환 ID, 상태, 메시지)
     */
    @Transactional
    public AIImageConversionResponse convertToImage(UUID roomId, AIImageConversionRequest request) {
        // 방 존재 여부 확인
        roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
        
        // 선택된 객체 ID 목록 검증
        if (request.getSelectedObjectIds() == null || request.getSelectedObjectIds().isEmpty()) {
            throw new IllegalArgumentException("선택된 객체가 없습니다.");
        }
        
        // 프롬프트 검증
        if (request.getPrompt() == null || request.getPrompt().trim().isEmpty()) {
            throw new IllegalArgumentException("프롬프트를 입력해주세요.");
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
        
        // TODO: 추후 AI API 호출 로직 추가
        // 현재는 검증만 수행하고 응답 반환
        
        return AIImageConversionResponse.builder()
                .conversionId(conversionId)
                .status("PENDING")
                .message("변환 요청이 접수되었습니다. (AI 통합 예정)")
                .build();
    }
}

