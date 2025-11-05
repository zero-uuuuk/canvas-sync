# WebSocket 확장 가이드

## 📋 개요

이 문서는 현재 Polling 방식으로 구현된 캔버스 실시간 동기화를 WebSocket으로 전환하는 방법을 상세히 설명합니다.

---

## 🔄 현재 구현: Polling 방식

### 현재 동작 방식

프론트엔드에서 **2.5초마다** 캔버스 객체 목록을 조회하여 변경사항을 감지합니다.

**구현 위치**: `frontend/src/pages/RoomPage.tsx`

```typescript
// 2.5초마다 polling 실행
const intervalId = setInterval(pollCanvasObjects, 2500);
```

### Polling 방식의 장단점

**장점:**
- 구현이 간단하고 추가 의존성 불필요
- REST API만 사용하여 호환성 좋음
- 서버 부하가 예측 가능함

**단점:**
- 약간의 지연 시간 존재 (최대 2.5초)
- 불필요한 네트워크 요청 발생
- 실시간성이 떨어짐

---

## 🚀 WebSocket으로 전환하기

### 1단계: 의존성 추가

`backend/build.gradle`에 Spring WebSocket 의존성 추가:

```gradle
dependencies {
    // 기존 의존성들...
    
    // WebSocket 지원
    implementation 'org.springframework.boot:spring-boot-starter-websocket'
    
    // STOMP 프로토콜 지원 (선택사항, 더 구조화된 메시징을 원할 경우)
    // implementation 'org.springframework:spring-messaging'
}
```

### 2단계: WebSocket 설정 클래스 생성

`backend/src/main/java/com/jangyeonguk/backend/config/WebSocketConfig.java` 생성:

```java
package com.jangyeonguk.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 메시지 브로커 설정
        // "/topic"으로 시작하는 경로에 메시지를 브로드캐스트
        config.enableSimpleBroker("/topic");
        // 클라이언트에서 서버로 메시지를 보낼 때 "/app" 접두사 사용
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 엔드포인트 등록
        // 클라이언트는 이 URL로 WebSocket 연결
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173", "http://www.localhost:5173")
                .withSockJS(); // SockJS 폴백 지원 (일부 브라우저 호환성)
    }
}
```

### 3단계: Security 설정 업데이트

`backend/src/main/java/com/jangyeonguk/backend/config/SecurityConfig.java` 수정:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/users/signup", "/api/users/login").permitAll()
            .requestMatchers("/ws/**").permitAll() // WebSocket 엔드포인트 허용
            .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
            .anyRequest().authenticated()
        );
    return http.build();
}
```

### 4단계: WebSocket 컨트롤러 생성

`backend/src/main/java/com/jangyeonguk/backend/controller/CanvasWebSocketController.java` 생성:

```java
package com.jangyeonguk.backend.controller;

import com.jangyeonguk.backend.dto.CanvasObjectResponse;
import com.jangyeonguk.backend.service.CanvasObjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class CanvasWebSocketController {

    private final CanvasObjectService canvasObjectService;

    /**
     * 캔버스 객체 생성 이벤트 처리
     * 클라이언트에서 "/app/rooms/{roomId}/canvas-objects/create"로 메시지 전송
     * 같은 방의 모든 클라이언트에게 "/topic/rooms/{roomId}/canvas-objects"로 브로드캐스트
     */
    @MessageMapping("/rooms/{roomId}/canvas-objects/create")
    @SendTo("/topic/rooms/{roomId}/canvas-objects")
    public CanvasObjectResponse handleCanvasObjectCreated(
            @DestinationVariable UUID roomId,
            CanvasObjectResponse canvasObject) {
        // 여기서 추가 검증이나 로깅을 수행할 수 있음
        return canvasObject;
    }

    /**
     * Undo 이벤트 처리
     */
    @MessageMapping("/rooms/{roomId}/canvas-objects/undo")
    @SendTo("/topic/rooms/{roomId}/canvas-objects")
    public String handleUndo(@DestinationVariable UUID roomId) {
        return "UNDO";
    }

    /**
     * Redo 이벤트 처리
     */
    @MessageMapping("/rooms/{roomId}/canvas-objects/redo")
    @SendTo("/topic/rooms/{roomId}/canvas-objects")
    public String handleRedo(@DestinationVariable UUID roomId) {
        return "REDO";
    }
}
```

### 5단계: CanvasObjectService 수정

`CanvasObjectService`에서 객체 생성/수정 시 WebSocket 메시지 브로드캐스트:

```java
@Service
@RequiredArgsConstructor
public class CanvasObjectService {
    
    private final CanvasObjectRepository canvasObjectRepository;
    private final SimpMessagingTemplate messagingTemplate; // WebSocket 메시징 템플릿

    @Transactional
    public CanvasObjectResponse createCanvasObject(UUID roomId, CanvasObjectCreateRequest request) {
        // 기존 로직...
        CanvasObjectResponse response = mapToResponse(savedObject);
        
        // WebSocket으로 같은 방의 모든 클라이언트에게 브로드캐스트
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/canvas-objects", response);
        
        return response;
    }

    @Transactional
    public CanvasObjectResponse undoCanvasObject(UUID roomId) {
        // 기존 로직...
        
        // WebSocket으로 Undo 이벤트 브로드캐스트
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/canvas-objects", "UNDO");
        
        return response;
    }
}
```

### 6단계: 프론트엔드 WebSocket 클라이언트 구현

#### 의존성 추가

`frontend/package.json`에 WebSocket 클라이언트 추가:

```json
{
  "dependencies": {
    "sockjs-client": "^1.6.1",
    "@stomp/stompjs": "^7.0.0"
  }
}
```

#### WebSocket 유틸리티 생성

`frontend/src/utils/websocketClient.ts` 생성:

```typescript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getToken } from './tokenStorage';

const WS_URL = 'http://localhost:8080/ws';

export class CanvasWebSocketClient {
  private client: Client;
  private roomId: string;
  private subscriptions: Map<string, any> = new Map();

  constructor(roomId: string) {
    this.roomId = roomId;
    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected');
        this.subscribeToCanvasUpdates();
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame);
      },
    });
  }

  connect() {
    const token = getToken();
    if (token) {
      this.client.configure({
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    this.client.activate();
  }

  disconnect() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.client.deactivate();
  }

  private subscribeToCanvasUpdates() {
    const subscription = this.client.subscribe(
      `/topic/rooms/${this.roomId}/canvas-objects`,
      (message) => {
        const data = JSON.parse(message.body);
        // 이벤트 처리 로직
        if (data === 'UNDO') {
          // Undo 처리
        } else if (data === 'REDO') {
          // Redo 처리
        } else {
          // 새 객체 추가
        }
      }
    );
    this.subscriptions.set('canvas-updates', subscription);
  }

  sendCanvasObjectCreated(canvasObject: any) {
    this.client.publish({
      destination: `/app/rooms/${this.roomId}/canvas-objects/create`,
      body: JSON.stringify(canvasObject),
    });
  }
}
```

#### RoomPage에 WebSocket 통합

`frontend/src/pages/RoomPage.tsx` 수정:

```typescript
import { useEffect, useRef } from 'react';
import { CanvasWebSocketClient } from '../utils/websocketClient';

export function RoomPage() {
  const wsClientRef = useRef<CanvasWebSocketClient | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // WebSocket 클라이언트 생성 및 연결
    wsClientRef.current = new CanvasWebSocketClient(roomId);
    wsClientRef.current.connect();

    return () => {
      // 컴포넌트 언마운트 시 연결 해제
      wsClientRef.current?.disconnect();
    };
  }, [roomId]);

  // Polling 로직 제거 또는 WebSocket과 병행 사용
  // ...
}
```

---

## 🔀 마이그레이션 전략

### 단계적 전환

1. **Phase 1**: WebSocket 구현 후 Polling과 병행 사용
   - WebSocket 연결 실패 시 Polling으로 폴백
   - 두 방식을 모두 지원하여 안정성 확보

2. **Phase 2**: WebSocket이 안정화되면 Polling 제거
   - 모든 클라이언트가 WebSocket을 지원하는지 확인
   - Polling 로직 제거

### 폴백 전략

```typescript
// WebSocket 연결 상태 확인
if (wsClientRef.current?.isConnected()) {
  // WebSocket 사용
} else {
  // Polling으로 폴백
  pollCanvasObjects();
}
```

---

## 📝 추가 고려사항

### 1. 인증 처리

WebSocket 연결 시 JWT 토큰을 헤더에 포함:

```java
@Configuration
public class WebSocketSecurityConfig {
    
    @Bean
    public DefaultHandshakeHandler handshakeHandler() {
        return new DefaultHandshakeHandler() {
            @Override
            protected Principal determineUser(
                    ServerHttpRequest request,
                    WebSocketHandler wsHandler,
                    Map<String, Object> attributes) {
                // JWT 토큰 검증 및 사용자 추출
                // attributes에 사용자 정보 저장
                return userPrincipal;
            }
        };
    }
}
```

### 2. 에러 처리

WebSocket 연결 실패 시 자동 재연결 및 폴백:

```typescript
client.onConnect = () => {
  console.log('WebSocket connected');
  // Polling 중지
  clearInterval(pollingInterval);
};

client.onStompError = (frame) => {
  console.error('WebSocket error:', frame);
  // Polling 재시작
  startPolling();
};
```

### 3. 성능 최적화

- 메시지 브로딩: 여러 객체를 한 번에 전송
- 압축: 큰 페이로드는 압축하여 전송
- 연결 풀링: 여러 방에 동시 연결 시 연결 수 관리

---

## 🎯 결론

WebSocket으로 전환하면:
- ✅ 실시간 동기화 (지연 시간 거의 없음)
- ✅ 서버 부하 감소 (불필요한 polling 요청 제거)
- ✅ 네트워크 트래픽 감소
- ✅ 더 나은 사용자 경험

하지만 구현 복잡도가 증가하므로, MVP 단계에서는 Polling 방식을 사용하고, 프로덕션 단계에서 WebSocket으로 전환하는 것을 권장합니다.

