## Deployment Guide

This guide covers deploying India-MCP to Railway (Gateway) and Vercel (Playground).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        India-MCP                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────────────┐      ┌─────────────────────────┐   │
│   │    Vercel            │      │    Railway              │   │
│   │  ┌────────────────┐  │      │  ┌───────────────────┐  │   │
│   │  │  Playground     │  │      │  │  Gateway           │  │   │
│   │  │  Next.js 14    │  │──────▶│  │  Express + Prisma  │  │   │
│   │  └────────────────┘  │      │  └───────────────────┘  │   │
│   │   :3000 (auto)        │      │   :3001 (auto)           │   │
│   └──────────────────────┘      └─────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Railway Deployment (Gateway)

### Step 1: Connect Repository

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `india-mcp` repository
4. Railway should auto-detect `railway.toml`

### Step 2: Configure Environment Variables

In Railway dashboard, add these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `JWT_SECRET` | `your-secure-random-string` | Secret for JWT signing |
| `ALLOWED_ORIGINS` | `https://your-vercel-app.vercel.app` | Comma-separated frontend URLs |
| `NODE_ENV` | `production` | Set to production |

### Step 3: Database Setup

Railway will auto-run `npx prisma generate` via postinstall script.

To run migrations manually:
```bash
railway run npx prisma migrate deploy
```

### Step 4: Verify Deployment

Health check endpoint: `GET /health`

Expected response:
```json
{
  "status": "ok",
  "uptime": 12345,
  "version": "1.0.0"
}
```

---

## Vercel Deployment (Playground)

### Step 1: Connect Repository

1. Go to [Vercel](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your `india-mcp` repository
4. Select `apps/playground` as the root directory
5. Framework: Next.js (auto-detected)

### Step 2: Configure Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_GATEWAY_URL` | `https://your-railway-app.up.railway.app` | Your Railway gateway URL |

### Step 3: Deploy

Click "Deploy" - Vercel will automatically:
1. Run `npm install`
2. Run `npm run build`
3. Deploy the Next.js application

---

## Local Development

### Prerequisites
- Node.js 22.x (see `.nvmrc`)
- Railway CLI (optional)
- Vercel CLI (optional)

### Setup

```bash
# Clone and install
git clone https://github.com/Samarth-23-eng/India-MCP.git
cd India-MCP
npm install

# Gateway development
cd apps/gateway
npm run dev

# Playground development (in another terminal)
cd apps/playground
npm run dev
```

### Production Build

```bash
# Build gateway
cd apps/gateway
npm run build
npm start

# Build playground
cd apps/playground
npm run build
npm start
```

---

## Troubleshooting

### Railway

**Build fails:**
- Ensure `NODE_ENV` is set correctly
- Check that `dist/` is being generated

**Health check fails:**
- Verify `DATABASE_URL` is set
- Check logs for Prisma connection errors

**CORS errors:**
- Add your Vercel domain to `ALLOWED_ORIGINS`

### Vercel

**Build fails:**
- Ensure root directory is set to `apps/playground`
- Check that `NEXT_PUBLIC_GATEWAY_URL` is set

**Blank page:**
- Verify `NEXT_PUBLIC_GATEWAY_URL` points to running Railway instance
- Check browser console for network errors

**Hydration errors:**
- Ensure all `'use client'` directives are present
- Check for server-only imports in client components

---

## Environment Variables Reference

### Gateway (Railway)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-min-32-chars
ALLOWED_ORIGINS=https://your-app.vercel.app,https://localhost:3000
PORT=3001
```

### Playground (Vercel)
```env
NEXT_PUBLIC_GATEWAY_URL=https://your-railway-app.up.railway.app
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | TypeScript compilation |
| `npm run dev` | Development with hot reload |
| `npm start` | Production server |
| `npm run typecheck` | TypeScript validation |
| `npm run postinstall` | Prisma client generation |
