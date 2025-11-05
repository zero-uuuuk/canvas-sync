package com.jangyeonguk.backend.service;

import com.jangyeonguk.backend.dto.CanvasObjectCreateRequest;
import com.jangyeonguk.backend.dto.CanvasObjectResponse;
import com.jangyeonguk.backend.dto.CanvasObjectUpdateRequest;
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
     * 개별 캔버스 객체 삭제 (soft delete)
     * 
     * @param roomId 방 ID
     * @param objectId 객체 ID
     * @return 삭제된 캔버스 객체 정보
     */
    @Transactional
    public CanvasObjectResponse deleteCanvasObject(UUID roomId, UUID objectId) {
        // 방 존재 여부 확인
        roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
        
        // 객체 조회
        CanvasObject canvasObject = canvasObjectRepository.findById(objectId)
                .orElseThrow(() -> new CanvasObjectNotFoundException("캔버스 객체를 찾을 수 없습니다: " + objectId));
        
        // 방에 속한 객체인지 확인
        if (!canvasObject.getRoom().getRoomId().equals(roomId)) {
            throw new IllegalArgumentException("해당 방에 속한 객체가 아닙니다.");
        }
        
        // 이미 삭제된 객체인지 확인
        if (canvasObject.getIsDeleted()) {
            throw new IllegalArgumentException("이미 삭제된 객체입니다.");
        }
        
        // soft delete 처리
        canvasObject.setIsDeleted(true);
        CanvasObject savedObject = canvasObjectRepository.save(canvasObject);
        
        return mapToResponse(savedObject);
    }
    
    /**
     * 캔버스 객체 업데이트 (objectData 수정)
     * 
     * @param roomId 방 ID
     * @param objectId 객체 ID
     * @param request 업데이트 요청 (objectData)
     * @return 업데이트된 캔버스 객체 정보
     */
    @Transactional
    public CanvasObjectResponse updateCanvasObject(UUID roomId, UUID objectId, CanvasObjectUpdateRequest request) {
        // 방 존재 여부 확인
        roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
        
        // 객체 조회
        CanvasObject canvasObject = canvasObjectRepository.findById(objectId)
                .orElseThrow(() -> new CanvasObjectNotFoundException("캔버스 객체를 찾을 수 없습니다: " + objectId));
        
        // 방에 속한 객체인지 확인
        if (!canvasObject.getRoom().getRoomId().equals(roomId)) {
            throw new IllegalArgumentException("해당 방에 속한 객체가 아닙니다.");
        }
        
        // 이미 삭제된 객체인지 확인
        if (canvasObject.getIsDeleted()) {
            throw new IllegalArgumentException("삭제된 객체는 수정할 수 없습니다.");
        }
        
        // objectData 업데이트
        canvasObject.setObjectData(request.getObjectData());
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

