## Backend 운영 가이드

### 1. 서비스 개요
- 스택: Spring Boot 3.5.7, Java 21, Gradle
- 배포 대상: Render Web Service (Docker 모드)
- 데이터베이스: Render PostgreSQL (또는 외부 호스트)
- 프론트엔드: `https://canvas-sync.vercel.app`

### 2. 로컬/빌드 준비
- `./gradlew bootJar`로 빌드 가능 여부 확인 (결과물: `build/libs/backend-0.0.1-SNAPSHOT.jar`)
- Docker 컨테이너 사용 시 `backend/Dockerfile` 확인 (멀티 스테이지 빌드, Amazon Corretto 21)
- 샘플 환경 변수는 `backend/.env.example`에서 확인, 로컬 실행용 `.env` 제공

### 3. Render 배포 절차
1. Render 대시보드 → **New → Web Service** → 저장소 연결
2. Deploy region은 DB와 동일 리전 선택 (예: Singapore)
3. **Runtime**: Docker 선택 (Java 프리셋이 없을 때 대안)
4. 추가 설정
   - Root Directory: `backend`
   - Dockerfile: `backend/Dockerfile`
   - Instance Type: Starter 이상 권장 (메모리 >512MB)
   - Health Check Path: `/actuator/health` (Actuator 의존성 추가 후)
   - Auto Deploy: main/production 브랜치에 맞춰 선택

### 4. 환경 변수 일람
- Render → 서비스 → **Environment** 탭에서 등록
- 모든 값은 운영에 맞춰 갱신 후 저장 (변경 후 재배포 필요)

| 키 | 기본값 (로컬) | 실제 적용 예시 | 설명 |
| --- | --- | --- | --- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/canvas_sync_db` | `jdbc:postgresql://dpg-***:5432/canvas_sync_db` | PostgreSQL 연결 URL |
| `SPRING_DATASOURCE_USERNAME` | `canvas_sync` | Render Connections의 Username | DB 사용자 |
| `SPRING_DATASOURCE_PASSWORD` | `canvas_sync_password` | Render Connections의 Password | DB 비밀번호 |
| `SPRING_DATASOURCE_DRIVER_CLASS_NAME` | `org.postgresql.Driver` | 동일 | JDBC 드라이버 |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` | 운영 시 `validate` 권장 | 스키마 동기화 전략 |
| `SPRING_JPA_SHOW_SQL` | `true` | 운영 시 `false` 고려 | SQL 로그 출력 여부 |
| `SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT` | `org.hibernate.dialect.PostgreSQLDialect` | 동일 | Hibernate Dialect |
| `SPRING_JPA_PROPERTIES_HIBERNATE_FORMAT_SQL` | `true` | 운영 시 `false` 가능 | SQL 포맷팅 |
| `JWT_SECRET` | `your-secret-key-...` | 강력한 랜덤 문자열 | JWT 서명 키 |
| `JWT_EXPIRATION` | `86400000` | 필요 시 조정 | JWT 만료 (ms) |
| `AI_SERVICE_URL` | `http://localhost:8000` | `https://<ai-service-domain>` | AI 연동 엔드포인트 |
| `APP_CORS_ALLOWED_ORIGINS` | `https://canvas-sync.vercel.app,https://www.canvas-sync.vercel.app,http://localhost:5173,http://www.localhost:5173` | 프론트/로컬 도메인 | CORS 허용 Origin 목록 |

> NOTE: `SecurityConfig`는 `app.cors.allowed-origins` 값을 쉼표 기준으로 파싱한다. 운영과 로컬을 동시에 허용하려면 콤마로 구분해 입력한다.

### 5. PostgreSQL 연동 & 관리
1. Render → **New → PostgreSQL**로 인스턴스 생성 (Name/DB/User 자유 지정)
2. Connection 탭 정보 사용
   - Hostname: `dpg-***` (External URL의 `@`와 `:` 사이)
   - Port: `5432`
   - Database: 예) `canvas_sync_db`
   - Username: 예) `canvas_sync`
   - Password: 표시된 전체 문자열
3. 환경 변수에 위 값을 반영
4. DBeaver 접속 방법
   - 새 PostgreSQL 연결 생성 → Host/Port/Database/User/Password 입력
   - SSL 탭에서 `Use SSL` 체크, `sslmode=require`
   - Test Connection 후 저장
   - Private Networking을 사용 중이면 외부에서 접근 불가, 외부 접속 시 External URL 사용

### 6. 프론트엔드 연동 정보
- 프론트 배포: `https://canvas-sync.vercel.app/auth`
- 프론트 `.env` / Vercel Env: `VITE_API_BASE_URL=https://canvas-sync.onrender.com/api`
- 백엔드 `APP_CORS_ALLOWED_ORIGINS`에 동일 도메인 추가 필요

### 7. Render Advanced 설정 권장 사항
- Health Check Path: `/actuator/health`
- Auto Deploy: 운영 브랜치 기준으로 Enable, 필요 시 수동 배포로 전환
- Private Network: 같은 리전의 DB와 연동 시 활성화 고려 (외부 접속 필요 시 비활성)
- Request Timeout: 장기 처리 API가 있다면 기본 30초에서 확장
- Build Cache: Docker 빌드 실패 시 Advanced 탭에서 “Clear build cache” 사용
- Always On: 활성화하여 콜드스타트 감소

### 8. 운영 중 빈번한 이슈 & 대응
- **빌드 실패 (Gradle)**: 캐시 초기화를 위해 `./gradlew clean` 또는 Render → Clear build cache
- **이미지 빌드 지연**: 멀티 스테이지 Dockerfile 유지, 필요 시 Render Pro 플랜 고려
- **DB 연결 오류**: Host/Port/Password 오타 확인, 보안 그룹/Private Network 상태 확인
- **CORS 오류**: `APP_CORS_ALLOWED_ORIGINS` 값을 확인하고 프론트 도메인 포함 여부 체크
- **JWT 관련 오류**: `JWT_SECRET` 길이/값 검증 (256비트 이상)
- **AI 연동 실패**: `AI_SERVICE_URL` 엔드포인트/헬스 체크

### 9. 참고 링크 / 파일
- Dockerfile: `backend/Dockerfile`
- 환경 변수 샘플: `backend/.env.example`
- Spring 설정: `backend/src/main/resources/application.properties`
- CORS 설정: `backend/src/main/java/com/jangyeonguk/backend/config/SecurityConfig.java`

### 10. 신규 참여자용 로컬 실행 가이드
1. **필수 준비물**
   - JDK 21 (Amazon Corretto 21 권장)
   - Docker (선택: 로컬 DB를 컨테이너로 띄울 경우)
   - Gradle은 `gradlew`로 제공되므로 추가 설치 불필요
2. **프로젝트 클론 및 이동**
   ```bash
   git clone <repo-url>
   cd canvas-sync/backend
   ```
3. **환경 변수 구성**
   - `cp .env.example .env`
   - 필요한 항목을 수정 후, 로컬 실행 전에 `export $(grep -v '^#' .env | xargs)` 등으로 세션에 반영하거나 IDE Run Configuration에 설정
4. **데이터베이스 옵션**
   - 로컬 컨테이너: `docker compose up -d postgres` (포트 5432)
   - Render DB 사용: `.env`의 `SPRING_DATASOURCE_*` 값을 Render Connections 정보로 교체
5. **애플리케이션 실행**
   - Gradle: `./gradlew bootRun`
   - JAR: `./gradlew bootJar` 후 `java -jar build/libs/backend-0.0.1-SNAPSHOT.jar`
   - Docker: `docker build -t canvas-sync-backend . && docker run -p 8080:8080 --env-file .env canvas-sync-backend`
6. **확인**
   - API 기본 주소: `http://localhost:8080/api`
   - 헬스 체크 (Actuator 사용 시): `http://localhost:8080/actuator/health`

