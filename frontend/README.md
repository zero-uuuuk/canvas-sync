## Canvas Sync Frontend

React + TypeScript + Vite로 구현된 `canvas-sync` 프로젝트의 프론트엔드 애플리케이션입니다.

### 1. 저장소 클론 & 디렉터리 이동

```bash
git clone https://github.com/zero-uuuuk/canvas-sync.git
cd canvas-sync/frontend
```

> 개인 포크를 사용한다면 `zero-uuuuk` 대신 본인 GitHub 계정명을 작성하세요.

### 2. 환경 준비 (Node 18 이상)

- 권장: `nvm` 혹은 `nvm-windows`로 Node LTS(18 또는 20 이상) 설치 후 `nvm use 20` 등으로 활성화
- 설치 확인: `node -v`, `npm -v`

### 3. 환경 변수 설정

```bash
cp .env.example .env
# 필요에 따라 API 엔드포인트 수정
echo "VITE_API_BASE_URL=https://api.example.com/api" >> .env
```

기본값은 `http://localhost:8080/api` 이며, 배포 환경에 맞춰 수정하세요.

### 4. 의존성 설치

```bash
npm install
```

### 5. 개발 서버 실행

```bash
npm run dev
```

- 브라우저에서 `http://localhost:5173` 접속
- Hot Module Replacement(HMR)로 변경 사항이 즉시 반영됨

### 6. 프로덕션 빌드

```bash
npm run build
```

- 결과물은 `dist/` 디렉터리에 생성
- 배포 전 `npm run preview`로 빌드 결과를 확인할 수 있음

### 7. 추가 정보

- 성능 측정: `App.tsx`에 `@vercel/speed-insights`가 포함되어 있어 Vercel 배포 시 자동으로 성능 인사이트가 수집됩니다.
- 라우팅: React Router를 사용하며, Vercel 배포 시 `vercel.json`의 리라이트 설정으로 새로고침 404를 방지합니다.

---

## 배포 체크리스트 (Vercel)

### 1. 사전 검증

- `npm run build`가 성공하는지 확인하고, `npm run preview`로 빌드 결과를 한 번 검수합니다.

### 2. 환경 변수

- `VITE_API_BASE_URL`을 Vercel 프로젝트의 Environment Variables에 등록합니다.
- 값이 없으면 애플리케이션은 기본값(`http://localhost:8080/api`)을 사용하므로, 백엔드 엔드포인트와 동기화되었는지 확인합니다.

### 3. Vercel 프로젝트 설정

- GitHub 저장소와 연결한 뒤, 프레임워크 프리셋은 `Vite` 또는 `Other`로 지정합니다.
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: `dist`
- 필요 시 `NODE_VERSION` 환경 변수로 런타임을 고정할 수 있습니다 (예: `20`).

### 4. Observability

- `@vercel/speed-insights`가 활성화되어 있으므로 배포 후 Vercel Dashboard에서 성능 인사이트를 확인합니다.

### 5. 새로고침 404 방지

- 루트 또는 `frontend` 디렉터리에 위치한 `vercel.json`의 리라이트 설정이 적용되어 모든 경로 요청이 `index.html`로 전달됩니다.
- 설정 변경 시 커밋/배포를 통해 반영되는지 확인하세요.

### 6. 배포 이력 이해하기

- Vercel의 `Deployments` 탭에서는 Production과 Preview 배포가 함께 표기됩니다.
- `Production` + `Current` 배지가 붙은 항목이 실제 라이브 URL을 가리키며, 커스텀 도메인 혹은 `*.vercel.app` 기본 도메인이 이 버전을 서빙합니다.
- `Production`만 표시되고 `Current`가 없는 항목은 과거에 라이브였지만 현재는 교체된 이력 기록입니다. 필요하면 해당 배포의 ⋯ 메뉴에서 `Promote to Production`을 선택해 롤백할 수 있습니다.
- Preview 배포는 PR이나 브랜치용 임시 URL로, 머지 후에도 기록은 남지만 프로덕션에는 영향을 주지 않습니다.

### 7. 비용(플랜)

- 현재 Vercel Hobby 플랜은 개인 사용자를 위한 무료 요금제입니다.
- 월별로 빌드 시간, 서버리스 실행 시간, Edge calls 등에 무료 할당량이 존재하며 이를 초과하면 배포가 제한되거나 Pro 이상 플랜으로 업그레이드해야 합니다.
- 팀원 수(1명)와 일부 고급 기능(Pro Insights, 멤버 관리 등)에 제약이 있으니 상용 서비스나 트래픽 증가가 예상되면 사전에 플랜 업그레이드를 고려하세요.

