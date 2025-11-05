# 소프트 삭제 최적화 가이드

## 📋 개요

이 문서는 소프트 삭제(Soft Delete)로 인한 데이터베이스 과부하 문제를 해결하기 위한 best practice를 설명합니다.

현재 구현에서는 `is_deleted` 플래그를 사용한 소프트 삭제만 구현되어 있어, 삭제된 객체들이 데이터베이스에 계속 누적되고 있습니다. 특히 지우개 기능 사용 시 여러 객체를 개별적으로 삭제하여 네트워크 요청이 과도하게 발생할 수 있습니다.

---

## 🔍 현재 문제점

### 1. 개별 삭제 API 호출
- **문제**: 지우개로 드래그할 때마다 각 객체를 개별적으로 삭제 API 호출
- **영향**: 네트워크 요청 수가 급증하여 서버 부하 증가
- **위치**: `frontend/src/pages/RoomPage.tsx` - `handleMouseMove` 함수

```typescript
// 현재 구현: 각 객체를 개별적으로 삭제
for (const objectId of objectsToDelete) {
  await canvasApi.deleteCanvasObject(roomId, objectId);
}
```

### 2. 소프트 삭제 데이터 누적
- **문제**: 삭제된 객체들이 DB에 계속 쌓여 테이블 크기 증가
- **영향**: 
  - 쿼리 성능 저하 (`isDeleted=false` 조건 검사 비용 증가)
  - 디스크 공간 낭비
  - 인덱스 크기 증가

### 3. 쿼리 성능 저하
- **문제**: `isDeleted=false` 조건만으로는 삭제된 레코드가 많아질수록 쿼리 비용 증가
- **영향**: `getCanvasObjects` 쿼리 성능 저하

---

## 🚀 해결 방안

### 방안 1: 배치 삭제 API 추가 (우선 권장)

여러 객체를 한 번에 삭제하는 API를 추가하여 네트워크 요청 수를 대폭 감소시킵니다.

#### 백엔드 구현

**1. Repository에 배치 삭제 메서드 추가**

`backend/src/main/java/com/jangyeonguk/backend/repository/CanvasObjectRepository.java`:

```java
@Modifying
@Query("UPDATE CanvasObject c SET c.isDeleted = true WHERE c.room.roomId = :roomId AND c.objectId IN :objectIds AND c.isDeleted = false")
int deleteCanvasObjectsBatch(@Param("roomId") UUID roomId, @Param("objectIds") List<UUID> objectIds);
```

**2. Service에 배치 삭제 메서드 추가**

`backend/src/main/java/com/jangyeonguk/backend/service/CanvasObjectService.java`:

```java
/**
 * 여러 캔버스 객체를 한 번에 삭제 (soft delete)
 * 
 * @param roomId 방 ID
 * @param objectIds 삭제할 객체 ID 목록
 * @return 삭제된 객체 수
 */
@Transactional
public int deleteCanvasObjectsBatch(UUID roomId, List<UUID> objectIds) {
    if (objectIds == null || objectIds.isEmpty()) {
        return 0;
    }
    
    // 방 존재 여부 확인
    roomRepository.findByRoomId(roomId)
            .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
    
    // 배치 삭제 실행
    int deletedCount = canvasObjectRepository.deleteCanvasObjectsBatch(roomId, objectIds);
    
    return deletedCount;
}
```

**3. Controller에 배치 삭제 엔드포인트 추가**

`backend/src/main/java/com/jangyeonguk/backend/controller/CanvasObjectController.java`:

```java
/**
 * 여러 캔버스 객체를 한 번에 삭제 (soft delete)
 * 
 * @param roomId 방 ID
 * @param request 삭제할 객체 ID 목록
 * @return 삭제된 객체 수
 */
@DeleteMapping("/batch")
public ResponseEntity<Map<String, Object>> deleteCanvasObjectsBatch(
        @PathVariable UUID roomId,
        @RequestBody Map<String, List<UUID>> request) {
    List<UUID> objectIds = request.get("objectIds");
    int deletedCount = canvasObjectService.deleteCanvasObjectsBatch(roomId, objectIds);
    
    Map<String, Object> response = new HashMap<>();
    response.put("deletedCount", deletedCount);
    response.put("message", deletedCount + "개의 객체가 삭제되었습니다.");
    
    return ResponseEntity.ok(response);
}
```

**4. DTO 추가 (선택사항)**

`backend/src/main/java/com/jangyeonguk/backend/dto/CanvasObjectBatchDeleteRequest.java`:

```java
package com.jangyeonguk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CanvasObjectBatchDeleteRequest {
    private List<UUID> objectIds;
}
```

#### 프론트엔드 구현

**1. API 함수 추가**

`frontend/src/api/canvasApi.ts`:

```typescript
/**
 * 여러 캔버스 객체를 한 번에 삭제
 */
async deleteCanvasObjectsBatch(roomId: string, objectIds: string[]): Promise<{ deletedCount: number; message: string }> {
  return apiPost<{ deletedCount: number; message: string }>(
    `/rooms/${roomId}/canvas-objects/batch`,
    { objectIds }
  );
}
```

**2. 지우개 로직 수정**

`frontend/src/pages/RoomPage.tsx` - `handleMouseMove` 함수:

```typescript
} else if (drawingMode === 'eraser' && roomId) {
  setCurrentPos(pos);
  
  // 지우개 영역과 겹치는 객체 찾기
  const eraserRadius = eraserSize;
  const objectsToDelete: string[] = [];
  
  canvasObjects.forEach((obj) => {
    if (erasedObjectIdsRef.current.has(obj.objectId)) {
      return;
    }
    
    if (checkEraserCollision(pos, eraserRadius, obj)) {
      objectsToDelete.push(obj.objectId);
    }
  });
  
  // 배치 삭제: 여러 객체를 한 번에 삭제
  if (objectsToDelete.length > 0) {
    try {
      const response = await canvasApi.deleteCanvasObjectsBatch(roomId, objectsToDelete);
      
      // 삭제된 객체 ID 추적
      objectsToDelete.forEach(id => erasedObjectIdsRef.current.add(id));
      
      // 로컬 상태에서도 제거
      setCanvasObjects((prev) => 
        prev.filter((obj) => !objectsToDelete.includes(obj.objectId))
      );
    } catch (err) {
      console.error('Failed to delete canvas objects:', err);
    }
  }
}
```

**3. 디바운싱 추가 (선택사항)**

지우개 드래그 중 API 호출 빈도를 줄이기 위해 디바운싱 적용:

```typescript
const eraseDebounceRef = useRef<NodeJS.Timeout | null>(null);

// handleMouseMove 내부
if (eraseDebounceRef.current) {
  clearTimeout(eraseDebounceRef.current);
}

eraseDebounceRef.current = setTimeout(async () => {
  if (objectsToDelete.length > 0) {
    // 배치 삭제 실행
  }
}, 100); // 100ms 디바운싱
```

---

### 방안 2: 하드 삭제 스케줄러 추가

일정 기간 이상 삭제된 객체를 실제로 삭제하는 스케줄러를 추가하여 DB 용량을 관리합니다.

#### 구현 방법

**1. 삭제된 시간 필드 추가 (선택사항)**

`backend/src/main/java/com/jangyeonguk/backend/entity/CanvasObject.java`:

```java
@Column(name = "deleted_at")
private OffsetDateTime deletedAt; // 삭제된 시간
```

**2. 스케줄러 서비스 생성**

`backend/src/main/java/com/jangyeonguk/backend/service/CanvasObjectCleanupService.java`:

```java
package com.jangyeonguk.backend.service;

import com.jangyeonguk.backend.repository.CanvasObjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CanvasObjectCleanupService {
    
    private final CanvasObjectRepository canvasObjectRepository;
    
    // 삭제 후 보관 기간 (일): 7일
    private static final int RETENTION_DAYS = 7;
    
    /**
     * 오래된 삭제된 객체들을 실제로 삭제
     * 매일 새벽 2시에 실행
     */
    @Scheduled(cron = "0 0 2 * * ?") // 매일 새벽 2시
    @Transactional
    public void cleanupDeletedObjects() {
        OffsetDateTime cutoffDate = OffsetDateTime.now().minusDays(RETENTION_DAYS);
        
        // 삭제된 지 7일 이상 된 객체들을 실제로 삭제
        List<CanvasObject> oldDeletedObjects = canvasObjectRepository
                .findByIsDeletedTrueAndDeletedAtBefore(cutoffDate);
        
        if (!oldDeletedObjects.isEmpty()) {
            int deletedCount = oldDeletedObjects.size();
            canvasObjectRepository.deleteAll(oldDeletedObjects);
            log.info("{}개의 오래된 삭제된 객체를 실제로 삭제했습니다.", deletedCount);
        }
    }
}
```

**3. Repository에 메서드 추가**

`backend/src/main/java/com/jangyeonguk/backend/repository/CanvasObjectRepository.java`:

```java
/**
 * 삭제된 지 일정 기간 이상 된 객체 조회
 */
List<CanvasObject> findByIsDeletedTrueAndDeletedAtBefore(OffsetDateTime cutoffDate);
```

**4. 스케줄러 활성화**

`backend/src/main/java/com/jangyeonguk/backend/CanavsSyncApplication.java`:

```java
@SpringBootApplication
@EnableScheduling // 스케줄러 활성화
public class CanavsSyncApplication {
    // ...
}
```

---

### 방안 3: 데이터베이스 인덱스 최적화

쿼리 성능을 향상시키기 위해 적절한 인덱스를 추가합니다.

#### 인덱스 추가 방법

**1. Entity에 인덱스 정의**

`backend/src/main/java/com/jangyeonguk/backend/entity/CanvasObject.java`:

```java
@Entity
@Table(name = "canvas_objects", indexes = {
    @Index(name = "idx_room_deleted", columnList = "room_id, is_deleted"),
    @Index(name = "idx_room_deleted_created", columnList = "room_id, is_deleted, created_at")
})
public class CanvasObject {
    // ...
}
```

**2. 또는 SQL 마이그레이션으로 직접 추가**

```sql
-- 복합 인덱스 추가
CREATE INDEX idx_room_deleted ON canvas_objects(room_id, is_deleted);
CREATE INDEX idx_room_deleted_created ON canvas_objects(room_id, is_deleted, created_at);

-- 삭제된 시간 기준 인덱스 (하드 삭제 스케줄러 사용 시)
CREATE INDEX idx_deleted_at ON canvas_objects(deleted_at) WHERE is_deleted = true;
```

---

### 방안 4: 프론트엔드 디바운싱/스로틀링

지우개 사용 시 API 호출 빈도를 줄이기 위해 디바운싱 또는 스로틀링을 적용합니다.

#### 디바운싱 구현

```typescript
const eraseDebounceRef = useRef<NodeJS.Timeout | null>(null);
const pendingDeletesRef = useRef<Set<string>>(new Set());

const handleMouseMove = async (e: React.MouseEvent<HTMLCanvasElement>) => {
  // ... 기존 코드 ...
  
  if (drawingMode === 'eraser' && roomId) {
    // 충돌하는 객체들을 pendingDeletes에 추가
    canvasObjects.forEach((obj) => {
      if (checkEraserCollision(pos, eraserRadius, obj)) {
        pendingDeletesRef.current.add(obj.objectId);
      }
    });
    
    // 디바운싱: 100ms 후에 배치 삭제 실행
    if (eraseDebounceRef.current) {
      clearTimeout(eraseDebounceRef.current);
    }
    
    eraseDebounceRef.current = setTimeout(async () => {
      const objectIds = Array.from(pendingDeletesRef.current);
      if (objectIds.length > 0 && roomId) {
        try {
          await canvasApi.deleteCanvasObjectsBatch(roomId, objectIds);
          objectIds.forEach(id => erasedObjectIdsRef.current.add(id));
          setCanvasObjects((prev) => 
            prev.filter((obj) => !objectIds.includes(obj.objectId))
          );
          pendingDeletesRef.current.clear();
        } catch (err) {
          console.error('Failed to delete canvas objects:', err);
        }
      }
    }, 100);
  }
};
```

#### 스로틀링 구현

```typescript
const lastEraseTimeRef = useRef<number>(0);
const ERASE_THROTTLE_MS = 200; // 200ms마다 최대 1회 실행

const handleMouseMove = async (e: React.MouseEvent<HTMLCanvasElement>) => {
  const now = Date.now();
  
  if (drawingMode === 'eraser' && now - lastEraseTimeRef.current < ERASE_THROTTLE_MS) {
    return; // 스로틀링: 너무 자주 실행되지 않도록
  }
  
  lastEraseTimeRef.current = now;
  // ... 삭제 로직 ...
};
```

---

## 📊 성능 비교

### 개별 삭제 vs 배치 삭제

| 방식 | 10개 객체 삭제 | 100개 객체 삭제 |
|------|---------------|----------------|
| 개별 삭제 | 10회 API 호출 | 100회 API 호출 |
| 배치 삭제 | 1회 API 호출 | 1회 API 호출 |
| **성능 향상** | **10배** | **100배** |

### 인덱스 추가 전후

| 상황 | 인덱스 없음 | 인덱스 있음 |
|------|------------|-----------|
| 삭제된 객체 1만개 | 전체 스캔 | 인덱스 사용 |
| 쿼리 시간 | ~100ms | ~5ms |
| **성능 향상** | - | **20배** |

---

## 🎯 권장 구현 순서

1. **1단계: 배치 삭제 API 추가** (즉시 효과)
   - 네트워크 요청 수 대폭 감소
   - 구현 난이도: 낮음

2. **2단계: 데이터베이스 인덱스 추가** (쿼리 성능 향상)
   - 쿼리 성능 개선
   - 구현 난이도: 낮음

3. **3단계: 프론트엔드 디바운싱 추가** (선택사항)
   - API 호출 빈도 추가 감소
   - 구현 난이도: 낮음

4. **4단계: 하드 삭제 스케줄러 추가** (장기적 관리)
   - DB 용량 관리
   - 구현 난이도: 중간

---

## 📝 추가 고려사항

### 1. 삭제된 시간 필드 추가

하드 삭제 스케줄러를 사용하려면 `deletedAt` 필드를 추가하는 것이 좋습니다:

```java
@Column(name = "deleted_at")
private OffsetDateTime deletedAt;
```

삭제 시 자동으로 설정:

```java
canvasObject.setIsDeleted(true);
canvasObject.setDeletedAt(OffsetDateTime.now());
```

### 2. 부분 인덱스 (PostgreSQL)

PostgreSQL의 부분 인덱스 기능을 활용하면 더 효율적입니다:

```sql
-- 삭제된 객체만 인덱싱
CREATE INDEX idx_deleted_objects ON canvas_objects(room_id, created_at) 
WHERE is_deleted = true;
```

### 3. 통계 정보 업데이트

정기적으로 통계 정보를 업데이트하여 쿼리 플래너가 최적의 실행 계획을 선택하도록 합니다:

```sql
ANALYZE canvas_objects;
```

### 4. 모니터링

삭제된 객체 수를 모니터링하여 적절한 시점에 하드 삭제를 실행합니다:

```java
@Scheduled(cron = "0 0 * * * ?") // 매시간
public void logDeletedObjectsCount() {
    long deletedCount = canvasObjectRepository.countByIsDeletedTrue();
    log.info("현재 삭제된 객체 수: {}", deletedCount);
}
```

---

## 🔧 구현 예시

### 완전한 배치 삭제 구현 예시

**Repository**:

```java
@Modifying
@Query("UPDATE CanvasObject c SET c.isDeleted = true, c.deletedAt = :deletedAt " +
       "WHERE c.room.roomId = :roomId AND c.objectId IN :objectIds AND c.isDeleted = false")
int deleteCanvasObjectsBatch(
    @Param("roomId") UUID roomId, 
    @Param("objectIds") List<UUID> objectIds,
    @Param("deletedAt") OffsetDateTime deletedAt
);
```

**Service**:

```java
@Transactional
public int deleteCanvasObjectsBatch(UUID roomId, List<UUID> objectIds) {
    if (objectIds == null || objectIds.isEmpty()) {
        return 0;
    }
    
    roomRepository.findByRoomId(roomId)
            .orElseThrow(() -> new RoomNotFoundException("방을 찾을 수 없습니다: " + roomId));
    
    OffsetDateTime deletedAt = OffsetDateTime.now();
    return canvasObjectRepository.deleteCanvasObjectsBatch(roomId, objectIds, deletedAt);
}
```

---

## 📚 참고 자료

- [Spring Data JPA @Modifying](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.modifying-queries)
- [PostgreSQL Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [Spring @Scheduled](https://docs.spring.io/spring-framework/docs/current/reference/html/integration.html#scheduling)

---

## ✅ 체크리스트

구현 시 다음 사항을 확인하세요:

- [ ] 배치 삭제 API 구현
- [ ] 프론트엔드에서 배치 삭제 사용
- [ ] 데이터베이스 인덱스 추가
- [ ] 하드 삭제 스케줄러 구현 (선택사항)
- [ ] 디바운싱/스로틀링 적용 (선택사항)
- [ ] 삭제된 객체 수 모니터링 (선택사항)
- [ ] 성능 테스트 및 검증

