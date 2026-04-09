# collabcanvas

A collaborative canvas editor built with Next.js, Zustand, React Konva, and Supabase.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=your-verified-sender@yourdomain.com
```

3. To enable workspace email invites, create a Resend account, verify a sender address, and set the two email variables above.

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Included Modules

- backend foundation and workspace loader
- Zustand workspace state
- React Konva canvas rendering
- editor toolbar and selection flow
- local snapshot handling
