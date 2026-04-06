# TELECA Web

Premium K-IP Trading Card brand website built with Next.js + Supabase.

## Setup

```bash
npm install
```

Edit `.env.local` with your Supabase service_role key.

## Development

```bash
npm run dev
```

Open http://localhost:3000

## Deployment

```bash
# Push to GitHub, then import in Vercel
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

In Vercel: Import → Add environment variables → Deploy
