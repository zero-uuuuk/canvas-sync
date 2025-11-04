package com.jangyeonguk.backend.service;

import com.jangyeonguk.backend.dto.UserLoginRequest;
import com.jangyeonguk.backend.dto.UserLoginResponse;
import com.jangyeonguk.backend.dto.UserLogoutResponse;
import com.jangyeonguk.backend.dto.UserSignupRequest;
import com.jangyeonguk.backend.dto.UserSignupResponse;
import com.jangyeonguk.backend.entity.User;
import com.jangyeonguk.backend.exception.InvalidCredentialsException;
import com.jangyeonguk.backend.exception.UserAlreadyExistsException;
import com.jangyeonguk.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 회원가입
     */
    @Transactional
    public UserSignupResponse signup(UserSignupRequest request) {
        // 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("이미 존재하는 이메일입니다: " + request.getEmail());
        }

        // 비밀번호 해싱
        String passwordHash = passwordEncoder.encode(request.getPassword());

        // 사용자 생성
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordHash)
                .displayName(request.getDisplayName())
                .build();

        User savedUser = userRepository.save(user);

        return UserSignupResponse.builder()
                .userId(savedUser.getUserId())
                .email(savedUser.getEmail())
                .displayName(savedUser.getDisplayName())
                .build();
    }

    /**
     * 로그인
     */
    public UserLoginResponse login(UserLoginRequest request) {
        // 이메일로 사용자 조회
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다."));

        // 비밀번호 확인
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return UserLoginResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .build();
    }

    /**
     * 로그아웃
     * 현재는 Stateless 세션 정책이므로 서버 측 세션 삭제는 불필요
     * JWT 기반 인증 구현 시 토큰 무효화 로직 추가 필요
     */
    public UserLogoutResponse logout() {
        // TODO: JWT 기반 인증 구현 시 토큰 블랙리스트 처리 또는 토큰 무효화 로직 추가
        return UserLogoutResponse.builder()
                .message("로그아웃되었습니다.")
                .build();
    }
}

