package com.jangyeonguk.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jangyeonguk.backend.dto.UserLoginRequest;
import com.jangyeonguk.backend.dto.UserLoginResponse;
import com.jangyeonguk.backend.dto.UserSignupRequest;
import com.jangyeonguk.backend.dto.UserSignupResponse;
import com.jangyeonguk.backend.exception.InvalidCredentialsException;
import com.jangyeonguk.backend.exception.UserAlreadyExistsException;
import com.jangyeonguk.backend.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = UserController.class, excludeAutoConfiguration = org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @TestConfiguration
    static class TestConfig {
        @Bean
        public UserService userService() {
            return mock(UserService.class);
        }
    }

    @Test
    @DisplayName("F-00 (1): 회원가입 - 성공")
    void signup_ShouldReturnCreated() throws Exception {
        // given
        UUID userId = UUID.randomUUID();
        String email = "user@example.com";
        String displayName = "사용자";
        
        UserSignupRequest request = UserSignupRequest.builder()
                .email(email)
                .password("password123")
                .displayName(displayName)
                .build();

        UserSignupResponse response = UserSignupResponse.builder()
                .userId(userId)
                .email(email)
                .displayName(displayName)
                .build();

        when(userService.signup(any(UserSignupRequest.class))).thenReturn(response);

        // when & then
        mockMvc.perform(post("/api/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(userId.toString()))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.displayName").value(displayName));
    }

    @Test
    @DisplayName("F-00 (1): 회원가입 - 이메일 중복")
    void signup_WhenEmailExists_ShouldReturnConflict() throws Exception {
        // given
        UserSignupRequest request = UserSignupRequest.builder()
                .email("existing@example.com")
                .password("password123")
                .displayName("사용자")
                .build();

        when(userService.signup(any(UserSignupRequest.class)))
                .thenThrow(new UserAlreadyExistsException("이미 존재하는 이메일입니다: existing@example.com"));

        // when & then
        mockMvc.perform(post("/api/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("User already exists"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("F-00 (2): 로그인 - 성공")
    void login_ShouldReturnOk() throws Exception {
        // given
        UUID userId = UUID.randomUUID();
        String email = "user@example.com";
        String displayName = "사용자";
        
        UserLoginRequest request = UserLoginRequest.builder()
                .email(email)
                .password("password123")
                .build();

        UserLoginResponse response = UserLoginResponse.builder()
                .userId(userId)
                .email(email)
                .displayName(displayName)
                .build();

        when(userService.login(any(UserLoginRequest.class))).thenReturn(response);

        // when & then
        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId.toString()))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.displayName").value(displayName));
    }

    @Test
    @DisplayName("F-00 (2): 로그인 - 잘못된 자격증명")
    void login_WithInvalidCredentials_ShouldReturnUnauthorized() throws Exception {
        // given
        UserLoginRequest request = UserLoginRequest.builder()
                .email("user@example.com")
                .password("wrongpassword")
                .build();

        when(userService.login(any(UserLoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다."));

        // when & then
        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid credentials"))
                .andExpect(jsonPath("$.message").exists());
    }
}

