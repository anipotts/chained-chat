# Scaffold Agent - chained.chat Base Setup

## Your Mission

You are the FIRST agent to run. Your job is to create the foundational repository structure that 3 parallel agents will build upon. You must complete ALL tasks before signaling ready.

**DO NOT proceed to parallel agent work until this scaffold is complete and deployed.**

---

## Prerequisites

Verify these are installed before starting:

```bash
node --version    # Should be 20+
pnpm --version    # Should be 8+
vercel --version  # Should be installed
gh --version      # GitHub CLI should be installed
```

If any are missing:
```bash
# Install pnpm if needed
npm install -g pnpm

# Install Vercel CLI if needed
pnpm add -g vercel

# Install GitHub CLI if needed (macOS)
brew install gh
gh auth login
```

---

## Tasks

### 1. Create New Git Repository

```bash
# Navigate to parent directory
cd /Users/anipotts/Code/active/gpt-wrappers

# Create new directory (this will be a NEW repo, separate from gpt-wrappers)
mkdir chained.chat
cd chained.chat

# Initialize git
git init
git branch -M main

# Verify
pwd  # Should show: /Users/anipotts/Code/active/gpt-wrappers/chained.chat
git status  # Should show: On branch main, No commits yet
```

---

### 2. Initialize Turborepo Monorepo

```bash
# Initialize Turborepo with basic template
pnpm dlx create-turbo@latest . --example basic --skip-install

# The example creates apps/docs and apps/web - we'll replace these
# Clean up example apps
rm -rf apps/docs apps/web

# Create our app structure
mkdir -p apps/web
mkdir -p packages/shared packages/db

# Install dependencies
pnpm install
```

---

### 3. Create Next.js 15 App

```bash
cd apps/web

# Create Next.js app with all recommended options
pnpm dlx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm \
  --turbopack

# Go back to root
cd ../..
```

---

### 4. Create Static Landing Page

Replace `apps/web/src/app/page.tsx` with this content:

```typescript
export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl">
        {/* Logo/Title */}
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          chained.chat
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-gray-400">
          One prompt. All models. See the difference.
        </p>

        {/* Model badges */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <ModelBadge name="GPT-4o" color="bg-emerald-900/50 border-emerald-700" />
          <ModelBadge name="Claude" color="bg-orange-900/50 border-orange-700" />
          <ModelBadge name="Gemini" color="bg-blue-900/50 border-blue-700" />
          <ModelBadge name="Grok" color="bg-purple-900/50 border-purple-700" />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 mt-8 max-w-md mx-auto">
          Compare responses from multiple AI models side-by-side.
          Find the best model for your task. Save time and money.
        </p>

        {/* Coming Soon */}
        <div className="mt-12 space-y-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider">Coming Soon</p>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full" />
        </div>
      </div>
    </main>
  );
}

function ModelBadge({ name, color }: { name: string; color: string }) {
  return (
    <div className={`px-4 py-2 rounded-lg border text-sm font-medium ${color}`}>
      {name}
    </div>
  );
}
```

Also update `apps/web/src/app/layout.tsx` to set metadata:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "chained.chat - Compare AI Models Side by Side",
  description: "One prompt. All models. See the difference. Compare responses from GPT-4, Claude, Gemini, and Grok simultaneously.",
  keywords: ["AI", "LLM", "GPT-4", "Claude", "Gemini", "Grok", "comparison", "chatbot"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

---

### 5. Configure Turbo

Update root `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

Update root `package.json` to include workspace scripts:

```json
{
  "name": "chained.chat",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "typecheck": "turbo typecheck",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  },
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=20"
  }
}
```

---

### 6. Test Local Development

```bash
# From root directory
pnpm dev

# Open http://localhost:3000 in browser
# Verify landing page displays correctly
# Press Ctrl+C to stop
```

---

### 7. Deploy to Vercel

```bash
# Login to Vercel (if not already)
vercel login

# Link to new project
vercel link

# When prompted:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project's name? chained-chat
# - In which directory is your code located? ./apps/web

# Deploy to production
vercel --prod

# Note the deployment URL (e.g., https://chained-chat.vercel.app)
```

---

### 8. Create GitHub Repository

```bash
# Create repo on GitHub (public for now, can make private later)
gh repo create chained-chat --public --source=. --remote=origin --push

# Verify
gh repo view --web  # Opens repo in browser
```

---

### 9. Initial Commit

```bash
# Add all files
git add .

# Create initial commit
git commit -m "Initial scaffold: Turborepo + Next.js 15 + static landing page

- Turborepo monorepo structure with pnpm workspaces
- Next.js 15 with App Router and Turbopack
- Static landing page with chained.chat branding
- Model badges for GPT-4o, Claude, Gemini, Grok
- Deployed to Vercel
- Ready for parallel agent development

Tech Stack:
- Next.js 15 (React 19)
- TypeScript 5
- Tailwind CSS
- Turborepo

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Push to GitHub
git push -u origin main
```

---

### 10. Prepare for Parallel Agents

Create worktree directory and add to gitignore:

```bash
# Create worktrees directory
mkdir worktrees

# Add to gitignore
echo "" >> .gitignore
echo "# Git worktrees for parallel agents" >> .gitignore
echo "worktrees/" >> .gitignore

# Commit gitignore update
git add .gitignore
git commit -m "chore: Add worktrees directory to gitignore"
git push
```

---

## Verification Checklist

Before signaling ready, verify ALL of the following:

- [ ] `pwd` shows `/Users/anipotts/Code/active/gpt-wrappers/chained.chat`
- [ ] `git remote -v` shows GitHub origin
- [ ] `pnpm dev` starts without errors
- [ ] http://localhost:3000 shows landing page with 4 model badges
- [ ] Vercel deployment is live and accessible
- [ ] `worktrees/` directory exists
- [ ] `.gitignore` includes `worktrees/`

---

## Signal Ready

Once ALL verification checks pass, output this message:

```
============================================
✅ SCAFFOLD COMPLETE - chained.chat
============================================

GitHub Repository: https://github.com/{YOUR_USERNAME}/chained-chat
Vercel Deployment: {YOUR_VERCEL_URL}
Local Directory:   /Users/anipotts/Code/active/gpt-wrappers/chained.chat

============================================
NEXT STEPS - Create Git Worktrees
============================================

Run these commands to create isolated worktrees for parallel agents:

cd /Users/anipotts/Code/active/gpt-wrappers/chained.chat

# Create worktrees for each parallel agent
git worktree add worktrees/agent-1-infrastructure feature/infrastructure
git worktree add worktrees/agent-2-frontend feature/frontend
git worktree add worktrees/agent-3-api feature/api

============================================
THEN - Launch 3 Parallel Claude Code Agents
============================================

Open 3 separate terminal windows and run:

Terminal 1 (Infrastructure):
  cd /Users/anipotts/Code/active/gpt-wrappers/chained.chat/worktrees/agent-1-infrastructure
  claude
  # Then paste the prompt from: docs/agents/phase-0/01-agent-infrastructure.md

Terminal 2 (Frontend):
  cd /Users/anipotts/Code/active/gpt-wrappers/chained.chat/worktrees/agent-2-frontend
  claude
  # Then paste the prompt from: docs/agents/phase-0/02-agent-frontend.md

Terminal 3 (API):
  cd /Users/anipotts/Code/active/gpt-wrappers/chained.chat/worktrees/agent-3-api
  claude
  # Then paste the prompt from: docs/agents/phase-0/03-agent-api.md

============================================
```

---

## Troubleshooting

### If Turborepo fails to install
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### If Next.js creation fails
```bash
cd apps/web
rm -rf *
pnpm dlx create-next-app@latest . --typescript --tailwind --eslint --app --use-pnpm
```

### If Vercel deployment fails
```bash
vercel logout
vercel login
vercel link --yes
vercel --prod
```

### If GitHub repo creation fails
```bash
gh auth login
gh repo create chained-chat --public --source=. --remote=origin
git push -u origin main
```
