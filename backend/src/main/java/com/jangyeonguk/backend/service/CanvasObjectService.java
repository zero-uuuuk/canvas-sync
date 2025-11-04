package com.jangyeonguk.backend.service;

import com.jangyeonguk.backend.dto.CanvasObjectCreateRequest;
import com.jangyeonguk.backend.dto.CanvasObjectResponse;
import com.jangyeonguk.backend.entity.CanvasObject;
import com.jangyeonguk.backend.entity.Room;
import com.jangyeonguk.backend.entity.User;
import com.jangyeonguk.backend.exception.CanvasObjectNotFoundException;
import com.jangyeonguk.backend.exception.RoomNotFoundException;
import com.jangyeonguk.backend.repository.CanvasObjectRepository;
import com.jangyeonguk.backend.repository.RoomRepository;
import com.jangyeonguk.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CanvasObjectService {
    
    private final CanvasObjectRepository canvasObjectRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    
    /**
     * 캔버스 객체 생성
     * 
     * @param roomId 방 ID
     * @param request 캔버스 객체 생성 요청
     * @return 생성된 캔버스 객체 정보
     */
    @Transactional
    public CanvasObjectResponse createCanvasObject(UUID roomId, CanvasObjectCreateRequest request) {
        // 방 조회
        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
        
        // 현재 인증된 사용자 조회
        UUID currentUserId = getCurrentUserId();
        User creator = userRepository.findByUserId(currentUserId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + currentUserId));
        
        // 캔버스 객체 생성
        CanvasObject canvasObject = CanvasObject.builder()
                .room(room)
                .creator(creator)
                .objectType(request.getObjectType())
                .objectData(request.getObjectData())
                .isDeleted(false)
                .build();
        
        CanvasObject savedObject = canvasObjectRepository.save(canvasObject);
        
        return mapToResponse(savedObject);
    }
    
    /**
     * 방의 캔버스 객체 목록 조회
     * 
     * @param roomId 방 ID
     * @return 캔버스 객체 목록
     */
    public List<CanvasObjectResponse> getCanvasObjects(UUID roomId) {
        List<CanvasObject> objects = canvasObjectRepository.findByRoom_RoomIdAndIsDeletedFalseOrderByCreatedAtAsc(roomId);
        
        return objects.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Undo: 가장 최근에 생성된 캔버스 객체 삭제 (soft delete)
     * 
     * @param roomId 방 ID
     * @return 삭제된 캔버스 객체 정보
     */
    @Transactional
    public CanvasObjectResponse undoCanvasObject(UUID roomId) {
        // 방 존재 여부 확인
        roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
        
        // 가장 최근에 생성된 캔버스 객체 조회 (삭제되지 않은 것만)
        Optional<CanvasObject> latestObject = canvasObjectRepository
                .findFirstByRoom_RoomIdAndIsDeletedFalseOrderByCreatedAtDesc(roomId);
        
        if (latestObject.isEmpty()) {
            throw new CanvasObjectNotFoundException("삭제할 캔버스 객체가 없습니다.");
        }
        
        CanvasObject canvasObject = latestObject.get();
        canvasObject.setIsDeleted(true);
        CanvasObject savedObject = canvasObjectRepository.save(canvasObject);
        
        return mapToResponse(savedObject);
    }
    
    /**
     * Redo: 가장 최근에 삭제된 캔버스 객체 복구 (soft delete 해제)
     * 
     * @param roomId 방 ID
     * @return 복구된 캔버스 객체 정보
     */
    @Transactional
    public CanvasObjectResponse redoCanvasObject(UUID roomId) {
        // 방 존재 여부 확인
        roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
        
        // 가장 최근에 삭제된 캔버스 객체 조회 (삭제된 것만)
        Optional<CanvasObject> latestDeletedObject = canvasObjectRepository
                .findFirstByRoom_RoomIdAndIsDeletedTrueOrderByCreatedAtDesc(roomId);
        
        if (latestDeletedObject.isEmpty()) {
            throw new CanvasObjectNotFoundException("복구할 캔버스 객체가 없습니다.");
        }
        
        CanvasObject canvasObject = latestDeletedObject.get();
        canvasObject.setIsDeleted(false);
        CanvasObject savedObject = canvasObjectRepository.save(canvasObject);
        
        return mapToResponse(savedObject);
    }
    
    /**
     * 헬퍼 메서드: 현재 인증된 사용자의 userId 추출
     * SecurityContext에서 인증 정보를 추출하여 사용자 ID를 반환
     */
    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("인증이 필요합니다. 로그인 후 다시 시도해주세요.");
        }
        
        // JwtAuthenticationFilter에서 principal을 userId.toString()으로 설정했으므로
        // principal을 UUID로 변환
        String principal = authentication.getPrincipal().toString();
        try {
            return UUID.fromString(principal);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("유효하지 않은 사용자 인증 정보입니다.");
        }
    }
    
    /**
     * 헬퍼 메서드: CanvasObject 엔티티를 CanvasObjectResponse DTO로 변환
     */
    private CanvasObjectResponse mapToResponse(CanvasObject canvasObject) {
        return CanvasObjectResponse.builder()
                .objectId(canvasObject.getObjectId())
                .roomId(canvasObject.getRoom().getRoomId())
                .creatorId(canvasObject.getCreator().getUserId())
                .objectType(canvasObject.getObjectType())
                .objectData(canvasObject.getObjectData())
                .createdAt(canvasObject.getCreatedAt())
                .build();
    }
}

