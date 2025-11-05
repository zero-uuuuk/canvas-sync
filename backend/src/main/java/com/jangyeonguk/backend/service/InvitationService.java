package com.jangyeonguk.backend.service;

import com.jangyeonguk.backend.dto.InvitationAcceptResponse;
import com.jangyeonguk.backend.dto.InvitationCreateResponse;
import com.jangyeonguk.backend.entity.Invitation;
import com.jangyeonguk.backend.entity.Room;
import com.jangyeonguk.backend.entity.RoomParticipant;
import com.jangyeonguk.backend.entity.RoomParticipantId;
import com.jangyeonguk.backend.entity.User;
import com.jangyeonguk.backend.exception.*;
import com.jangyeonguk.backend.repository.InvitationRepository;
import com.jangyeonguk.backend.repository.RoomParticipantRepository;
import com.jangyeonguk.backend.repository.RoomRepository;
import com.jangyeonguk.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvitationService {
    
    private final InvitationRepository invitationRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    
    // 초대 링크 만료 시간 (7일)
    private static final int INVITATION_EXPIRY_DAYS = 7;
    
    /**
     * 초대 링크 생성
     * 방의 소유자 또는 참가자만 초대 링크를 생성할 수 있음
     * 
     * @param roomId 방 ID
     * @return 초대 링크 정보
     */
    @Transactional
    public InvitationCreateResponse createInvitation(UUID roomId) {
        // 현재 인증된 사용자의 userId 추출
        UUID currentUserId = getCurrentUserId();
        
        // 사용자 조회
        User inviter = userRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + currentUserId));
        
        // 방 조회
        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
        
        // 현재 사용자가 방의 소유자이거나 참가자인지 확인
        boolean isOwner = room.getOwner().getUserId().equals(currentUserId);
        boolean isParticipant = roomParticipantRepository.existsById_UserIdAndId_RoomId(currentUserId, roomId);
        
        if (!isOwner && !isParticipant) {
            throw new UnauthorizedRoomAccessException("방에 대한 권한이 없습니다. 초대 링크를 생성할 수 없습니다.");
        }
        
        // 고유 토큰 생성
        String token = generateUniqueToken();
        
        // 만료 시간 설정 (현재 시간 + 7일)
        OffsetDateTime expiresAt = OffsetDateTime.now().plusDays(INVITATION_EXPIRY_DAYS);
        
        // 초대 엔티티 생성
        Invitation invitation = Invitation.builder()
                .token(token)
                .room(room)
                .inviter(inviter)
                .status(Invitation.InvitationStatus.PENDING)
                .expiresAt(expiresAt)
                .build();
        
        Invitation savedInvitation = invitationRepository.save(invitation);
        
        // 초대 링크 URL 생성 (프론트엔드 라우트 형식)
        String invitationUrl = "/invitations/" + token + "/accept";
        
        return InvitationCreateResponse.builder()
                .invitationId(savedInvitation.getInvitationId())
                .invitationToken(savedInvitation.getToken())
                .invitationUrl(invitationUrl)
                .expiresAt(savedInvitation.getExpiresAt())
                .build();
    }
    
    /**
     * 초대 수락
     * 초대 토큰을 받아서 검증하고, 사용자를 방의 참가자로 추가
     * 하나의 초대 링크는 여러 명이 동시에 사용할 수 있으며, 초대 상태는 계속 유효하게 유지됨
     * 만료 시간만 확인하여 유효성을 검증함
     * 
     * @param token 초대 토큰
     * @return 방 접속 정보
     */
    @Transactional
    public InvitationAcceptResponse acceptInvitation(String token) {
        // 현재 인증된 사용자의 userId 추출
        UUID currentUserId = getCurrentUserId();
        
        // 사용자 조회
        User user = userRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + currentUserId));
        
        // 토큰으로 초대 조회
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new InvitationNotFoundException("유효하지 않은 초대 링크입니다."));
        
        // 만료 시간 확인
        if (invitation.getExpiresAt().isBefore(OffsetDateTime.now())) {
            // 만료 상태로 업데이트
            invitation.setStatus(Invitation.InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new InvitationExpiredException("만료된 초대 링크입니다.");
        }
        
        // 사용자가 이미 방의 참가자인지 확인
        boolean alreadyParticipant = roomParticipantRepository.existsById_UserIdAndId_RoomId(
                currentUserId, invitation.getRoom().getRoomId());
        
        if (alreadyParticipant) {
            // 이미 참가자인 경우 방 정보만 반환 (초대 링크는 계속 유효하게 유지)
            return InvitationAcceptResponse.builder()
                    .roomId(invitation.getRoom().getRoomId())
                    .roomUrl("/rooms/" + invitation.getRoom().getRoomId())
                    .message("이미 참가 중인 방입니다.")
                    .build();
        }
        
        // RoomParticipant 생성 및 저장
        RoomParticipantId participantId = new RoomParticipantId(
                currentUserId, invitation.getRoom().getRoomId());
        RoomParticipant participant = RoomParticipant.builder()
                .id(participantId)
                .user(user)
                .room(invitation.getRoom())
                .websocketSessionId(null) // WebSocket 연결 시 설정
                .build();
        roomParticipantRepository.save(participant);
        
        // 초대 링크는 여러 명이 사용할 수 있으므로 상태를 변경하지 않음
        return InvitationAcceptResponse.builder()
                .roomId(invitation.getRoom().getRoomId())
                .roomUrl("/rooms/" + invitation.getRoom().getRoomId())
                .message("초대를 수락했습니다. 방에 참가했습니다.")
                .build();
    }
    
    /**
     * 헬퍼 메서드: 현재 인증된 사용자의 userId 추출
     */
    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("인증이 필요합니다. 로그인 후 다시 시도해주세요.");
        }
        
        String principal = authentication.getPrincipal().toString();
        try {
            return UUID.fromString(principal);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("유효하지 않은 사용자 인증 정보입니다.");
        }
    }
    
    /**
     * 헬퍼 메서드: 고유 토큰 생성
     * UUID를 사용하여 고유 토큰 생성
     */
    private String generateUniqueToken() {
        return UUID.randomUUID().toString();
    }
}

