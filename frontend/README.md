# Canvas Sync Frontend

`canvas-sync` 프로젝트의 프론트엔드 패키지입니다. React + TypeScript + Vite 기반으로 개발되며 협업 캔버스, AI 이미지 변환 기능 등을 제공합니다.

## 요구 사항

- Node.js 18 이상
- npm 9 이상 (또는 pnpm/yarn 등 원하는 패키지 매니저)

## 환경 변수

런타임에 불러올 API 도메인은 [`VITE_API_BASE_URL`] 환경 변수로 주입합니다. 기본값은 개발 편의를 위해 `http://localhost:8080/api`입니다.

| 이름 | 설명 | 예시 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 백엔드 REST API의 루트 URL | `https://api.example.com/api` |

### 로컬 개발

```bash
cp .env.example .env
echo "VITE_API_BASE_URL=http://localhost:8080/api" >> .env
npm install
npm run dev
```

### Vercel 배포

1. Vercel 프로젝트 설정에서 `Environment Variables` 섹션을 열어 `VITE_API_BASE_URL`을 추가합니다.
2. 값은 프로덕션 백엔드 엔드포인트(예: `https://api.example.com/api`)로 지정합니다.
3. 변경 후 재배포하면 새 환경변수가 빌드에 반영됩니다.

## 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run preview`: 빌드 결과 미리보기

## 코드 스타일

- ESLint와 Prettier 설정을 프로젝트 기준으로 맞춰두었습니다.
- VSCode 사용 시 추천 확장: ESLint, Prettier, Tailwind CSS IntelliSense (사용 중이라면).

## 폴더 구조 (요약)

```
src/
  api/            # API 통신 로직
  components/     # 재사용 가능한 UI 컴포넌트
  hooks/          # 커스텀 훅
  pages/          # 페이지 단위 컴포넌트
  types/          # 타입 정의
  utils/          # 유틸 함수
```

## 이슈/문의

버그, 개선 제안은 GitHub 이슈 또는 협업 도구(예: Slack, JIRA 등)로 공유해주세요.
