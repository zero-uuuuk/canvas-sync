# JWT 인증 기반 로그인 순서

## 📋 개요

이 문서는 JWT(JSON Web Token) 기반 인증 시스템의 로그인 및 인증 처리 순서를 상세히 설명합니다.

---

## 🔐 1단계: 로그인 요청 (클라이언트 → 서버)

```
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## 🔍 2단계: SecurityConfig 필터 체인 검사

`SecurityConfig`에서 `/api/users/login`은 `permitAll()`로 설정되어 있어 **인증 없이 접근 가능**합니다.

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/users/signup", "/api/users/login").permitAll()
    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
    .anyRequest().authenticated()
);
```

- `/api/users/login`은 `permitAll()`로 인증 없이 접근 가능
- `JwtAuthenticationFilter`는 실행되지만 토큰이 없어도 통과 가능

---

## 🎯 3단계: UserController 라우팅

```java
@PostMapping("/login")
public ResponseEntity<UserLoginResponse> login(@RequestBody UserLoginRequest request) {
    UserLoginResponse response = userService.login(request);
    return ResponseEntity.ok(response);
}
```

요청을 `UserService.login()`으로 전달합니다.

---

## 🔑 4단계: UserService 로그인 처리

```java
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
```

### 세부 단계:

1. **4-1. 이메일로 사용자 조회**
   - `UserRepository.findByEmail()`로 DB에서 사용자 조회
   - 사용자가 없으면 `InvalidCredentialsException` 발생

2. **4-2. 비밀번호 검증**
   - `PasswordEncoder.matches()`로 입력 비밀번호와 해시된 비밀번호 비교
   - 불일치 시 `InvalidCredentialsException` 발생

3. **4-3. JWT 토큰 생성**
   - `JwtUtil.generateToken()`으로 사용자 ID를 포함한 JWT 토큰 생성

---

## 🎫 5단계: JWT 토큰 생성 (JwtUtil)

```java
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
```

- **Claims 설정**: `subject` (userId), `issuedAt` (발급 시간), `expiration` (만료 시간)
- **서명**: HMAC-SHA256 알고리즘으로 서명
- **인코딩**: Base64 URL-safe 인코딩된 JWT 문자열 반환

---

## 📤 6단계: 로그인 응답 (서버 → 클라이언트)

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": "사용자",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDA4NjQwMH0..."
}
```

---

## 💾 7단계: 클라이언트가 토큰 저장

- 토큰을 **로컬 스토리지**, **세션 스토리지**, 또는 **메모리**에 저장
- 이후 API 요청 시 `Authorization` 헤더에 포함하여 전송

---

## 🔄 이후 인증된 요청 처리 순서

### 8단계: 인증이 필요한 API 요청

```
POST /api/rooms
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "새 방",
  "isAnonymous": false
}
```

---

### 9단계: JwtAuthenticationFilter 실행

```java
// Authorization 헤더에서 토큰 추출
String token = extractTokenFromRequest(request);

if (token != null && jwtUtil.validateToken(token)) {
    // 토큰에서 사용자 ID 추출
    UUID userId = jwtUtil.getUserIdFromToken(token);
    
    // Authentication 객체 생성
    Authentication authentication = createAuthentication(userId, request);
    
    // SecurityContext에 인증 정보 설정
    SecurityContextHolder.getContext().setAuthentication(authentication);
}
```

### 세부 단계:

1. **9-1. 토큰 추출**
   - `Authorization` 헤더에서 `Bearer <token>` 형식으로 토큰 추출
   - `extractTokenFromRequest()` 메서드 사용

2. **9-2. 토큰 검증**
   - `JwtUtil.validateToken()`으로 토큰 유효성 검증
   - 서명 검증 및 만료 시간 확인

3. **9-3. 사용자 ID 추출**
   - `JwtUtil.getUserIdFromToken()`으로 토큰에서 사용자 ID 추출

4. **9-4. Authentication 객체 생성**
   - `UsernamePasswordAuthenticationToken` 생성
   - Principal: userId (String)
   - Authorities: ROLE_USER

5. **9-5. SecurityContext에 인증 정보 설정**
   - `SecurityContextHolder.getContext().setAuthentication()`으로 인증 정보 저장

---

### 10단계: SecurityConfig 권한 검사

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/users/signup", "/api/users/login").permitAll()
    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
    .anyRequest().authenticated()
);
```

- `SecurityContext`에 인증 정보가 있으면 `authenticated()` 통과
- 인증 정보가 없으면 **401 Unauthorized** 반환

---

### 11단계: Controller 및 Service 처리

- `RoomService.getCurrentUserId()` 등에서 `SecurityContextHolder`에서 사용자 ID 추출
- 비즈니스 로직 실행

```java
private UUID getCurrentUserId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    
    if (authentication == null || !authentication.isAuthenticated()) {
        throw new IllegalStateException("인증이 필요합니다. 로그인 후 다시 시도해주세요.");
    }
    
    String principal = authentication.getPrincipal().toString();
    return UUID.fromString(principal);
}
```

---

### 12단계: 응답 반환

- 요청 처리 후 `SecurityContext`는 **요청 범위 내에서만 유지** (STATELESS)
- 다음 요청은 다시 **9단계부터 시작**

---

## 📊 전체 흐름 요약

### 로그인 시
```
클라이언트 
  → SecurityConfig (permitAll) 
  → UserController 
  → UserService (이메일/비밀번호 검증) 
  → JwtUtil (토큰 생성) 
  → 응답 (토큰 포함) 
  → 클라이언트 저장
```

### 인증된 요청 시
```
클라이언트 (토큰 포함) 
  → JwtAuthenticationFilter (토큰 검증/추출) 
  → SecurityContext 설정 
  → SecurityConfig (authenticated 검사) 
  → Controller 
  → Service (SecurityContext에서 사용자 ID 추출) 
  → 응답
```

---

## 🔐 STATELESS 아키텍처

- 모든 요청은 **독립적으로 처리**됩니다
- 서버는 **세션을 저장하지 않습니다** (STATELESS)
- 각 요청마다 JWT 토큰을 검증하여 인증 정보를 설정합니다
- `SecurityContext`는 **요청 범위 내에서만 유지**되며, 요청이 끝나면 소멸합니다

---

## 📝 참고사항

- JWT 토큰 만료 시간: `application.properties`의 `jwt.expiration` 설정 (기본값: 86400000ms = 24시간)
- JWT 시크릿 키: `application.properties`의 `jwt.secret` 설정
- 토큰은 `Authorization: Bearer <token>` 형식으로 전송해야 합니다
- 로그아웃은 클라이언트에서 토큰을 삭제하는 것으로 처리됩니다 (STATELESS이므로 서버 측 세션 삭제 불필요)

