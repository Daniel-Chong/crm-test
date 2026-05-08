# CRM Test

## Supabase 연결 및 DB 설정

1. Supabase에서 새 프로젝트 생성
2. `supabase/schema.sql`에 있는 SQL을 Supabase SQL 에디터에서 실행하여 `clients` 테이블 생성
3. 루트에 `.env` 파일 생성

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

4. 패키지 설치 및 개발 서버 실행

```bash
npm install
npm run dev
```

5. 실제 배포 빌드

```bash
npm run build
```

## Cloudflare Pages 설정

- Production branch: `main`
- Build command: `npm run build`
- Output directory: `dist`

### 참고

- `index.html`은 Vite로 빌드된 정적 사이트입니다.
- Supabase 접속 정보는 `.env` 파일에 저장하고 절대 Git에 커밋하지 마세요.
