package com.jangyeonguk.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        // Authorization 헤더에서 토큰 추출
        String token = extractTokenFromRequest(request);
        
        // 토큰이 있고, 유효하며, 블랙리스트에 없는 경우에만 인증 처리
        if (token != null && jwtUtil.validateToken(token)) {
            // 토큰에서 사용자 ID 추출
            UUID userId = jwtUtil.getUserIdFromToken(token);
            
            // Authentication 객체 생성
            Authentication authentication = createAuthentication(userId, request);
            
            // SecurityContext에 인증 정보 설정
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        
        // 다음 필터로 요청 전달
        filterChain.doFilter(request, response);
    }

    /**
     * HTTP 요청에서 JWT 토큰 추출
     * 
     * @param request HTTP 요청
     * @return JWT 토큰 또는 null
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        
        if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        
        return null;
    }

    /**
     * Authentication 객체 생성
     * 
     * @param userId 사용자 ID
     * @param request HTTP 요청
     * @return Authentication 객체
     */
    private Authentication createAuthentication(UUID userId, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userId.toString(), // principal (사용자 식별자)
                null, // credentials (비밀번호 등, JWT에서는 null)
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")) // 권한
        );
        
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        
        return authentication;
    }
}

