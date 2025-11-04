package com.jangyeonguk.backend.controller;

import com.jangyeonguk.backend.dto.RoomCreateRequest;
import com.jangyeonguk.backend.dto.RoomCreateResponse;
import com.jangyeonguk.backend.dto.RoomResponse;
import com.jangyeonguk.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {
    
    private final RoomService roomService;
    
    /**
     * F-01a: 새 캔버스(방) 생성
     * 모든 방은 사용자와 연결되며, isAnonymous가 true면 다른 참가자들에게 "익명"으로 표시됨
     * 현재 인증된 사용자의 userId는 서버에서 자동으로 추출 (보안)
     * 
     * @param request 방 생성 요청
     *                - title: 선택사항, null이면 기본값 "새 팔레트" 사용
     *                - isAnonymous: true면 익명으로 생성 (다른 참가자들에게 "익명"으로 표시)
     * @return 생성된 방의 정보 및 URL
     */
    @PostMapping
    public ResponseEntity<RoomCreateResponse> createRoom(@RequestBody(required = false) RoomCreateRequest request) {
        RoomCreateResponse response = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 전체 방 리스트 조회
     * 대시보드에서 최근 업데이트된 순서로 정렬된 방 목록을 반환
     * 
     * @return 방 목록 (최근 업데이트된 순서)
     */
    @GetMapping
    public ResponseEntity<List<RoomResponse>> getAllRooms() {
        List<RoomResponse> rooms = roomService.getAllRooms();
        return ResponseEntity.ok(rooms);
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

