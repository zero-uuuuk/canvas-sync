package com.jangyeonguk.backend.controller;

import com.jangyeonguk.backend.dto.InvitationAcceptResponse;
import com.jangyeonguk.backend.service.InvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {
    
    private final InvitationService invitationService;
    
    /**
     * F-03: 초대 수락
     * 초대 토큰을 받아서 검증하고, 사용자를 방의 참가자로 추가
     * 
     * @param token 초대 토큰
     * @return 방 접속 정보
     */
    @PostMapping("/{token}/accept")
    public ResponseEntity<InvitationAcceptResponse> acceptInvitation(@PathVariable String token) {
        InvitationAcceptResponse response = invitationService.acceptInvitation(token);
        return ResponseEntity.ok(response);
    }
}

