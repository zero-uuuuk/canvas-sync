package com.jangyeonguk.backend.service;

import com.jangyeonguk.backend.config.JwtUtil;
import com.jangyeonguk.backend.dto.UserLoginRequest;
import com.jangyeonguk.backend.dto.UserLoginResponse;
import com.jangyeonguk.backend.dto.UserLogoutResponse;
import com.jangyeonguk.backend.dto.UserSignupRequest;
import com.jangyeonguk.backend.dto.UserSignupResponse;
import com.jangyeonguk.backend.entity.User;
import com.jangyeonguk.backend.exception.InvalidCredentialsException;
import com.jangyeonguk.backend.exception.UserAlreadyExistsException;
import com.jangyeonguk.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

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

        // JWT 토큰 생성
        String token = jwtUtil.generateToken(user.getUserId());

        return UserLoginResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .token(token)
                .build();
    }

    /**
     * 로그아웃
     * JWT 토큰을 블랙리스트에 추가하여 무효화
     * 
     * @param request HTTP 요청 (Authorization 헤더에서 토큰 추출)
     * @return 로그아웃 성공 메시지
     */
    public UserLogoutResponse logout(HttpServletRequest request) {
        // Authorization 헤더에서 토큰 추출
        String token = extractTokenFromRequest(request);
        
        if (token != null && jwtUtil.validateToken(token)) {
            // 토큰을 블랙리스트에 추가하여 무효화
            jwtUtil.addToBlacklist(token);
            
            return UserLogoutResponse.builder()
                    .message("로그아웃되었습니다. 토큰이 무효화되었습니다.")
                    .build();
        }
        
        // 토큰이 없거나 유효하지 않은 경우에도 로그아웃 성공으로 처리
        return UserLogoutResponse.builder()
                .message("로그아웃되었습니다.")
                .build();
    }

    /**
     * HTTP 요청에서 JWT 토큰 추출
     * 
     * @param request HTTP 요청
     * @return JWT 토큰 또는 null
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        
        return null;
    }
}

