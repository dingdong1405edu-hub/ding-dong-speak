# Ding Dong Speak

AI SaaS luyện IELTS Speaking bằng Next.js App Router + Tailwind + TypeScript + Prisma + PostgreSQL.

## Tính năng

- Google login only với NextAuth + PrismaAdapter
- Dashboard có VIP status, tiến độ, heatmap streak
- Chế độ luyện Part 1 / Part 2 / Part 3 / Thi thử
- Ghi âm trực tiếp trên web
- `/api/transcribe` dùng Deepgram
- `/api/grade` dùng Groq, ép strict JSON
- Trừ 1 credit cho mỗi lần chấm nếu chưa Pro
- PayOS checkout + webhook nâng cấp Pro
- Export PDF kết quả buổi luyện

## ENV

Xem `.env.example`.

## Local

```bash
npm install
npm run db:push
npm run dev
```
