package com.jangyeonguk.backend.service;

import com.jangyeonguk.backend.dto.RoomCreateRequest;
import com.jangyeonguk.backend.dto.RoomCreateResponse;
import com.jangyeonguk.backend.dto.RoomResponse;
import com.jangyeonguk.backend.entity.Room;
import com.jangyeonguk.backend.entity.RoomParticipant;
import com.jangyeonguk.backend.entity.RoomParticipantId;
import com.jangyeonguk.backend.entity.User;
import com.jangyeonguk.backend.exception.RoomNotFoundException;
import com.jangyeonguk.backend.repository.RoomParticipantRepository;
import com.jangyeonguk.backend.repository.RoomRepository;
import com.jangyeonguk.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomService {
    
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    
    /**
     * 새 방 생성
     * 모든 방은 사용자와 연결되며, isAnonymous가 true면 다른 참가자들에게 "익명"으로 표시됨
     * 현재 인증된 사용자의 userId를 자동으로 추출 (보안상 서버에서 처리)
     * 
     * TODO: 인증 시스템 연동 시 SecurityContext에서 현재 사용자 정보 추출
     */
    @Transactional
    public RoomCreateResponse createRoom(RoomCreateRequest request) {
        // 현재 인증된 사용자의 userId 추출 (나중에 인증 시스템과 연동)
        UUID currentUserId = getCurrentUserId(); // TODO: SecurityContext에서 추출
        
        User owner = null;
        if (currentUserId != null) {
            owner = userRepository.findByUserId(currentUserId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + currentUserId));
        }
        
        // TODO: 현재는 인증 시스템이 없으므로 임시 처리
        // 인증 시스템 연동 후에는 owner가 null일 수 없음
        if (owner == null) {
            throw new IllegalArgumentException("인증이 필요합니다. 로그인 후 방을 생성해주세요.");
        }
        
        // isAnonymous 플래그 설정
        boolean isAnonymous = (request != null && request.getIsAnonymous() != null) 
                ? request.getIsAnonymous() 
                : false; // 기본값은 false (익명 아님)
        
        // request가 null이거나 title이 null이거나 비어있으면 기본값 "새 팔레트" 사용
        String title = (request != null && request.getTitle() != null) ? request.getTitle() : null;
        String roomTitle = (title == null || title.trim().isEmpty()) ? "새 팔레트" : title;
        
        Room room = Room.builder()
                .title(roomTitle)
                .owner(owner) // 모든 방은 사용자와 연결됨
                .isAnonymous(isAnonymous)
                .build();
        
        Room savedRoom = roomRepository.save(room);
        
        // 방 생성자(owner)를 RoomParticipant에 자동 추가
        RoomParticipantId participantId = new RoomParticipantId(owner.getUserId(), savedRoom.getRoomId());
        RoomParticipant participant = RoomParticipant.builder()
                .id(participantId)
                .user(owner)
                .room(savedRoom)
                .websocketSessionId(null) // WebSocket 연결 시 설정
                .build();
        roomParticipantRepository.save(participant);
        
        return RoomCreateResponse.builder()
                .roomId(savedRoom.getRoomId())
                .roomUrl("/rooms/" + savedRoom.getRoomId())
                .build();
    }
    
    /**
     * 전체 방 목록 조회
     * 최근 업데이트된 순서로 정렬하여 반환
     * 
     * @return 방 목록 (최근 업데이트된 순서)
     */
    public List<RoomResponse> getAllRooms() {
        List<Room> rooms = roomRepository.findAllByOrderByLastUpdatedAtDesc();
        
        return rooms.stream()
                .map(this::mapToRoomResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * 방 상세 조회
     * 방의 상세 정보를 반환
     * 
     * @param roomId 방 ID
     * @return 방 정보
     */
    public RoomResponse getRoom(UUID roomId) {
        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
        
        return mapToRoomResponse(room);
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
     * 헬퍼 메서드: Room 엔티티를 RoomResponse DTO로 변환
     */
    private RoomResponse mapToRoomResponse(Room room) {
        // isAnonymous가 true면 "익명"으로 표시, false면 displayName 표시
        String ownerName = room.getIsAnonymous() 
                ? "익명" 
                : room.getOwner().getDisplayName();
        
        // ownerId는 항상 존재 (모든 방은 사용자와 연결됨)
        // 하지만 익명 방의 경우 ownerId를 노출하지 않을 수도 있음 (보안 고려)
        UUID ownerId = room.getIsAnonymous() ? null : room.getOwner().getUserId();
        
        return RoomResponse.builder()
                .roomId(room.getRoomId())
                .title(room.getTitle())
                .ownerId(ownerId)
                .ownerName(ownerName)
                .createdAt(room.getCreatedAt())
                .lastUpdatedAt(room.getLastUpdatedAt())
                .build();
    }
}

