package com.jangyeonguk.backend.controller;

import com.jangyeonguk.backend.dto.CanvasObjectCreateRequest;
import com.jangyeonguk.backend.dto.CanvasObjectResponse;
import com.jangyeonguk.backend.service.CanvasObjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms/{roomId}/canvas-objects")
@RequiredArgsConstructor
public class CanvasObjectController {
    
    private final CanvasObjectService canvasObjectService;
    
    /**
     * F-02 (1): 캔버스 객체 생성
     * 
     * @param roomId 방 ID
     * @param request 캔버스 객체 생성 요청
     * @return 생성된 캔버스 객체 정보
     */
    @PostMapping
    public ResponseEntity<CanvasObjectResponse> createCanvasObject(
            @PathVariable UUID roomId,
            @RequestBody CanvasObjectCreateRequest request) {
        CanvasObjectResponse response = canvasObjectService.createCanvasObject(roomId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * F-02 (2): 방의 캔버스 객체 목록 조회
     * 
     * @param roomId 방 ID
     * @return 캔버스 객체 목록
     */
    @GetMapping
    public ResponseEntity<List<CanvasObjectResponse>> getCanvasObjects(@PathVariable UUID roomId) {
        List<CanvasObjectResponse> objects = canvasObjectService.getCanvasObjects(roomId);
        return ResponseEntity.ok(objects);
    }
    
    /**
     * F-02 (3): Undo - 가장 최근에 생성된 캔버스 객체 삭제
     * 
     * @param roomId 방 ID
     * @return 삭제된 캔버스 객체 정보
     */
    @DeleteMapping("/undo")
    public ResponseEntity<CanvasObjectResponse> undoCanvasObject(@PathVariable UUID roomId) {
        CanvasObjectResponse response = canvasObjectService.undoCanvasObject(roomId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * F-02 (4): Redo - 가장 최근에 삭제된 캔버스 객체 복구
     * 
     * @param roomId 방 ID
     * @return 복구된 캔버스 객체 정보
     */
    @PostMapping("/redo")
    public ResponseEntity<CanvasObjectResponse> redoCanvasObject(@PathVariable UUID roomId) {
        CanvasObjectResponse response = canvasObjectService.redoCanvasObject(roomId);
        return ResponseEntity.ok(response);
    }
}

