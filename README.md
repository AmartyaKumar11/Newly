## Newly — Phase 1 scaffold

Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind, ShadCN-ready, NextAuth (Google), MongoDB/Mongoose, Supabase storage, Gemini.

### What’s in place
- Auth: Google OAuth via NextAuth with MongoDB adapter
- Database: `db.ts` connection helper, `User` and `Newsletter` models
- APIs: Newsletter CRUD (`/api/newsletters`), AI test route (`/api/ai/test`)
- Services: Gemini client helper, Supabase storage stub
- UI: Landing page, login/signup, protected dashboard + editor placeholders

### Required environment
Create `.env.local` with:
```
MONGODB_URI=<your-mongodb-uri>
MONGODB_DB=<optional-db-name>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
GEMINI_API_KEY=<google-gemini-api-key>
SUPABASE_URL=<supabase-url>
SUPABASE_KEY=<supabase-service-role-or-public-key>
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-string>
```

### Scripts
- `npm run dev` — start dev server
- `npm run build` — build for production
- `npm run start` — start production build
- `npm run lint` — run ESLint

### Next steps
- Wire dashboard to newsletter APIs
- Build drag-and-drop editor with Zustand state
- Add brand kit settings and export flows (HTML/PDF/PNG)
