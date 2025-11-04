package com.jangyeonguk.backend.service;

import com.jangyeonguk.backend.dto.RoomCreateRequest;
import com.jangyeonguk.backend.dto.RoomCreateResponse;
import com.jangyeonguk.backend.dto.RoomResponse;
import com.jangyeonguk.backend.entity.Room;
import com.jangyeonguk.backend.entity.User;
import com.jangyeonguk.backend.exception.RoomNotFoundException;
import com.jangyeonguk.backend.repository.RoomRepository;
import com.jangyeonguk.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomService {
    
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    
    /**
     * 익명으로 새 방 생성 (기존 함수)
     */
    @Transactional
    public RoomCreateResponse createRoom(RoomCreateRequest request) {
        return createRoomInternal(request, null);
    }
    
    /**
     * 사용자로 새 방 생성 (익명이 아닐 경우)
     * 기존 함수를 활용하여 owner 정보만 추가
     */
    @Transactional
    public RoomCreateResponse createRoom(RoomCreateRequest request, UUID ownerId) {
        User owner = userRepository.findByUserId(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + ownerId));
        
        return createRoomInternal(request, owner);
    }
    
    /**
     * 방 생성 공통 로직 (기존 함수의 핵심 로직)
     * 익명 생성과 사용자 생성을 모두 처리할 수 있도록 owner를 파라미터로 받음
     */
    @Transactional
    private RoomCreateResponse createRoomInternal(RoomCreateRequest request, User owner) {
        // request가 null이거나 title이 null이거나 비어있으면 기본값 "새 팔레트" 사용
        String title = (request != null && request.getTitle() != null) ? request.getTitle() : null;
        String roomTitle = (title == null || title.trim().isEmpty()) ? "새 팔레트" : title;
        
        Room room = Room.builder()
                .title(roomTitle)
                .owner(owner) // 익명이면 null, 사용자면 owner 설정
                .build();
        
        Room savedRoom = roomRepository.save(room);
        
        return RoomCreateResponse.builder()
                .roomId(savedRoom.getRoomId())
                .roomUrl("/room/" + savedRoom.getRoomId())
                .build();
    }
    
    public RoomResponse getRoom(UUID roomId) {
        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
        
        return RoomResponse.builder()
                .roomId(room.getRoomId())
                .title(room.getTitle())
                .ownerId(room.getOwner() != null ? room.getOwner().getUserId() : null)
                .createdAt(room.getCreatedAt())
                .lastUpdatedAt(room.getLastUpdatedAt())
                .build();
    }
}

