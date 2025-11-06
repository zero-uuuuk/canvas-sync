## Render 배포 가이드

### 1. 개요
- 대상: `backend` (Spring Boot 3.5.7, Java 21)
- 목표: Render Web Service로 배포 및 PostgreSQL 연동
- 기본 전제: GitHub 저장소가 Render와 연동 가능하며, 환경 변수는 Render 대시보드에서 관리한다.

### 2. 사전 준비
- 로컬에서 `./gradlew bootJar`로 JAR 생성 여부 확인
- 필요 환경 변수 목록 정리 (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `AI_SERVICE_URL` 등)
- 데이터베이스로 Render PostgreSQL 또는 외부 PostgreSQL 준비

### 3. Render Web Service 생성
1. Render 대시보드 → **New** → **Web Service** → 저장소 선택
2. Root Directory에 `backend` 입력
3. Build Command: `./gradlew clean build -x test`
4. Start Command: `java -jar build/libs/backend-0.0.1-SNAPSHOT.jar`
   - 버전 변경 시 `build/libs` 내부 JAR 파일명 확인 후 수정
5. Instance Type: 최소 Starter 이상 선택 (JVM 메모리 고려)

### 4. 환경 변수 설정
- Render Dashboard → 서비스 → **Environment** 탭에서 추가
- 로컬 기본값(`application.properties`)은 개발용으로 두고, Render 환경 변수로 상용값을 오버라이드한다.

| 키 | 기본값 (로컬) | 설명 |
| --- | --- | --- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/canvas_sync_db` | PostgreSQL 연결 URL |
| `SPRING_DATASOURCE_USERNAME` | `canvas_sync` | DB 사용자 |
| `SPRING_DATASOURCE_PASSWORD` | `canvas_sync_password` | DB 비밀번호 |
| `SPRING_DATASOURCE_DRIVER_CLASS_NAME` | `org.postgresql.Driver` | JDBC 드라이버 |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` | 스키마 동기화 전략 |
| `SPRING_JPA_SHOW_SQL` | `true` | SQL 로그 출력 여부 |
| `SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT` | `org.hibernate.dialect.PostgreSQLDialect` | Hibernate Dialect |
| `SPRING_JPA_PROPERTIES_HIBERNATE_FORMAT_SQL` | `true` | SQL 포맷팅 |
| `JWT_SECRET` | `your-secret-key-...` | JWT 서명 키 (운영 환경에서 필수 변경) |
| `JWT_EXPIRATION` | `86400000` | JWT 만료 시간 (ms) |
| `AI_SERVICE_URL` | `http://localhost:8000` | AI 서비스 엔드포인트 |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://www.localhost:5173` | CORS 허용 Origin 목록 (콤마 구분) |

### 5. PostgreSQL 연동
1. Render → **New** → **PostgreSQL** 생성
2. 생성 완료 후 **Connection** 탭에서 연결 정보 확인
3. Web Service 환경 변수에 Host/Port/Database/User/Password 반영
4. 초기 데이터베이스 스키마는 `spring.jpa.hibernate.ddl-auto=update`로 자동 생성되지만, 운영 단계에서는 마이그레이션 도구(Flyway 등) 도입 권장

### 6. 헬스체크 및 운영 설정
- Spring Boot Actuator 의존성을 추가했다면 `/actuator/health`를 Render Health Check Path로 설정
- `Always On` 활성화로 콜드 스타트 최소화
- 로그는 Render Event Log에서 확인, 외부 모니터링 연동 시 APM 도입 고려

### 7. CI/CD 흐름
- 기본: 선택한 브랜치에 push → 자동 빌드 & 배포
- 필요 시 Production 브랜치 지정 또는 Auto Deploy 끄고 수동 배포 전환
- Pull Request Preview 활성화로 미리보기 환경 제공 가능

### 8. 추가 참고 사항
- Docker 방식 배포를 원하면 `Dockerfile` 작성 후 Render에서 Docker 모드 선택
- JWT Secret, 데이터베이스 자격 증명 등은 정기적으로 교체하는 정책 수립
- 외부 AI 서비스와의 통신 시 CORS/Security 설정을 `SecurityConfig`에서 점검

### 9. 문제 해결 체크리스트
- 빌드 실패 시: Gradle 버전/Java 버전 확인, 캐시 초기화를 위해 Clean Build 수행
- 실행 실패 시: 환경 변수 누락, DB 접근 권한, JAR 경로 확인
- 응답 지연 시: 인스턴스 타입 업그레이드, DB 연결 상태 모니터링


