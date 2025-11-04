package com.jangyeonguk.backend.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class JwtUtil {

    @Value("${jwt.secret:your-secret-key-must-be-at-least-256-bits-long-for-hmac-sha-256-algorithm}")
    private String secret;

    @Value("${jwt.expiration:86400000}") // 기본값: 24시간 (밀리초)
    private Long expiration;

    // 토큰 블랙리스트 (토큰 문자열을 키로, 만료 시간을 값으로 저장)
    private final Set<String> tokenBlacklist = ConcurrentHashMap.newKeySet();

    /**
     * JWT 시크릿 키 생성
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * JWT 토큰 생성
     * 
     * @param userId 사용자 ID (UUID)
     * @return JWT 토큰 문자열
     */
    public String generateToken(UUID userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * JWT 토큰에서 사용자 ID 추출
     * 
     * @param token JWT 토큰
     * @return 사용자 ID (UUID)
     */
    public UUID getUserIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return UUID.fromString(claims.getSubject());
    }

    /**
     * JWT 토큰에서 Claims 추출
     * 
     * @param token JWT 토큰
     * @return Claims
     */
    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * JWT 토큰 유효성 검증
     * 
     * @param token JWT 토큰
     * @return 유효한 토큰인지 여부
     */
    public boolean validateToken(String token) {
        try {
            // 블랙리스트에 있는 토큰은 무효
            if (isBlacklisted(token)) {
                return false;
            }
            
            getClaimsFromToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 토큰을 블랙리스트에 추가 (로그아웃 시 호출)
     * 
     * @param token 무효화할 JWT 토큰
     */
    public void addToBlacklist(String token) {
        if (token != null && validateTokenStructure(token)) {
            tokenBlacklist.add(token);
        }
    }

    /**
     * 토큰이 블랙리스트에 있는지 확인
     * 
     * @param token 확인할 JWT 토큰
     * @return 블랙리스트에 있으면 true
     */
    public boolean isBlacklisted(String token) {
        return tokenBlacklist.contains(token);
    }

    /**
     * 토큰 구조만 검증 (만료 여부는 무시)
     * 
     * @param token JWT 토큰
     * @return 유효한 구조인지 여부
     */
    private boolean validateTokenStructure(String token) {
        try {
            getClaimsFromToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 만료된 토큰을 블랙리스트에서 제거 (메모리 최적화)
     * 주기적으로 호출하여 메모리를 정리할 수 있음
     */
    public void removeExpiredTokens() {
        tokenBlacklist.removeIf(token -> {
            try {
                return isTokenExpired(token);
            } catch (Exception e) {
                return true; // 파싱 실패 시 제거
            }
        });
    }

    /**
     * JWT 토큰 만료 여부 확인
     * 
     * @param token JWT 토큰
     * @return 만료되었는지 여부
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            Date expiration = claims.getExpiration();
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
}

