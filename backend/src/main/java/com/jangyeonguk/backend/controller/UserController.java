package com.jangyeonguk.backend.controller;

import com.jangyeonguk.backend.dto.UserLoginRequest;
import com.jangyeonguk.backend.dto.UserLoginResponse;
import com.jangyeonguk.backend.dto.UserLogoutResponse;
import com.jangyeonguk.backend.dto.UserSignupRequest;
import com.jangyeonguk.backend.dto.UserSignupResponse;
import com.jangyeonguk.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * F-00 (1): 회원가입
     * 
     * @param request 회원가입 요청 (email, password, displayName)
     * @return 생성된 사용자 정보
     */
    @PostMapping("/signup")
    public ResponseEntity<UserSignupResponse> signup(@RequestBody UserSignupRequest request) {
        UserSignupResponse response = userService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * F-00 (2): 로그인
     * 
     * @param request 로그인 요청 (email, password)
     * @return 사용자 정보
     */
    @PostMapping("/login")
    public ResponseEntity<UserLoginResponse> login(@RequestBody UserLoginRequest request) {
        UserLoginResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * F-00 (3): 로그아웃
     * 
     * @return 로그아웃 성공 메시지
     */
    @PostMapping("/logout")
    public ResponseEntity<UserLogoutResponse> logout() {
        UserLogoutResponse response = userService.logout();
        return ResponseEntity.ok(response);
    }
}

