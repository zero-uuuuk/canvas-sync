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
        
        // 현재 인증된 사용자 조회 (임시로 첫 번째 사용자 사용)
        UUID currentUserId = getCurrentUserId();
        User creator = null;
        if (currentUserId != null) {
            creator = userRepository.findByUserId(currentUserId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + currentUserId));
        }
        
        if (creator == null) {
            throw new IllegalArgumentException("인증이 필요합니다. 로그인 후 캔버스 객체를 생성해주세요.");
        }
        
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
     * TODO: 인증 시스템 연동 시 SecurityContext에서 추출
     */
    private UUID getCurrentUserId() {
        // TODO: SecurityContext.getContext().getAuthentication()에서 추출
        // 임시로 UserRepository에서 첫 번째 사용자를 가져옴 (인증 시스템 연동 후 제거)
        return userRepository.findAll().stream()
                .findFirst()
                .map(User::getUserId)
                .orElse(null);
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

