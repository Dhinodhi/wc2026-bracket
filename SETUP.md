# WC 2026 Bracket Game — Setup Guide
# Total time: ~15 minutes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — GITHUB (host your code)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://github.com and sign in (or create a free account)
2. Click the "+" icon → "New repository"
3. Name it: wc2026-bracket
4. Set to Public, leave everything else default → click "Create repository"
5. Download GitHub Desktop from https://desktop.github.com (easiest way to push files)
6. In GitHub Desktop: File → Add Local Repository → choose the wc2026 folder
   (or drag the wc2026 folder onto GitHub Desktop)
7. Click "Publish repository" → make sure it matches your repo name → Publish
   ✓ Your code is now on GitHub

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — SUPABASE (your free database)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://supabase.com → click "Start your project" → sign up free
2. Click "New project"
   - Name: wc2026-bracket
   - Set a database password (save it somewhere)
   - Region: pick US East or West
   - Click "Create new project" (takes ~60 seconds)

3. Once loaded, click "SQL Editor" in the left sidebar
4. Paste this SQL and click "Run":

   CREATE TABLE players (
     name TEXT PRIMARY KEY,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE picks (
     player_name TEXT REFERENCES players(name),
     match_id TEXT NOT NULL,
     home INT,
     away INT,
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     PRIMARY KEY (player_name, match_id)
   );

5. Go to Settings → API (left sidebar)
6. Copy two values — you'll need them in Step 3:
   - "Project URL" (looks like https://abcdef.supabase.co)
   - "anon public" key (long string under "Project API keys")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — NETLIFY (your free public URL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://netlify.com → sign up free (use "Continue with GitHub")
2. Click "Add new site" → "Import an existing project" → GitHub
3. Authorize Netlify to access your repos → select "wc2026-bracket"
4. Build settings (Netlify usually auto-detects these, but verify):
   - Build command: npm run build
   - Publish directory: dist
5. Before clicking Deploy, click "Environment variables" → "Add a variable":
   - Key: VITE_SUPABASE_URL    Value: (paste your Supabase Project URL)
   - Key: VITE_SUPABASE_ANON_KEY    Value: (paste your anon key)
6. Click "Deploy site"
   ✓ In ~2 minutes you'll have a live URL like: https://wc2026-bracket.netlify.app

7. Optional: click "Domain settings" → "Options" → "Edit site name" to customize
   the subdomain (e.g. dhino-worldcup.netlify.app)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — SHARE WITH FRIENDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Just send them the Netlify URL. Each person:
1. Opens the link on phone or desktop
2. Types their name → enters their picks
3. Picks auto-save instantly to Supabase
4. Returning visitors: type the same name to resume

The Scoreboard tab shows everyone's live points as match results roll in.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPDATING RESULTS AS MATCHES ARE PLAYED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Open src/data.js and find the COMPLETED object near the top.
Add results like this:

  D1: { home: 2, away: 1 },  // USA 2–1 Paraguay

Then in GitHub Desktop: commit the change → push.
Netlify auto-deploys in ~60 seconds → scores update for everyone.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Connection error" on login:
→ Check that your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
  correctly in Netlify's environment variables (no trailing spaces)
→ Re-deploy after saving env vars: Netlify → Deploys → "Trigger deploy"

Picks not saving:
→ Make sure you ran the SQL in Step 2 to create both tables
→ Check Supabase → Table Editor to confirm "players" and "picks" tables exist

Build fails on Netlify:
→ Confirm build command is: npm run build
→ Confirm publish directory is: dist
