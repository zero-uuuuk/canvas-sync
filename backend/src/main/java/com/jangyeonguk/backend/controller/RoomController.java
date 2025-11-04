package com.jangyeonguk.backend.controller;

import com.jangyeonguk.backend.dto.RoomCreateRequest;
import com.jangyeonguk.backend.dto.RoomCreateResponse;
import com.jangyeonguk.backend.dto.RoomResponse;
import com.jangyeonguk.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {
    
    private final RoomService roomService;
    
    /**
     * F-01a (1): 익명으로 새 캔버스(방) 생성
     * 메인 페이지에서 버튼 클릭 시, 고유 room_id를 가진 새 캔버스 생성
     * 
     * @param request 방 생성 요청 (title은 선택사항, null이면 기본값 "새 팔레트" 사용)
     * @return 생성된 방의 정보 및 URL
     */
    @PostMapping
    public ResponseEntity<RoomCreateResponse> createRoom(@RequestBody(required = false) RoomCreateRequest request) {
        RoomCreateResponse response = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * F-01a (2): 사용자로 새 캔버스(방) 생성
     * 인증된 사용자가 고유 room_id를 가진 새 캔버스 생성
     * 
     * @param request 방 생성 요청 (title은 선택사항, null이면 기본값 "새 팔레트" 사용)
     * @param ownerId 방 생성자(owner)의 사용자 ID
     * @return 생성된 방의 정보 및 URL
     */
    @PostMapping("/user/{ownerId}")
    public ResponseEntity<RoomCreateResponse> createRoomWithOwner(
            @RequestBody(required = false) RoomCreateRequest request,
            @PathVariable UUID ownerId) {
        RoomCreateResponse response = roomService.createRoom(request, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * F-01b: 고유 URL로 캔버스 입장
     * 생성된 고유 URL(.../room/{room_id})을 받은 사람이 해당 URL로 직접 접속 및 입장
     * 
     * @param roomId 방 ID
     * @return 방 정보
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable UUID roomId) {
        RoomResponse response = roomService.getRoom(roomId);
        return ResponseEntity.ok(response);
    }
}

