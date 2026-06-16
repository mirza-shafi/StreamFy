# StreamFy - Setup & Deployment Guide

## 1. Supabase SQL — Run in SQL Editor

Go to: https://supabase.com/dashboard → Your Project → SQL Editor → New Query

```sql
-- Create matches table
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team1 text NOT NULL,
  team2 text NOT NULL,
  team1_flag text,
  team2_flag text,
  tournament text,
  match_time timestamptz,
  stream_url text,
  backup_stream_url text,
  status text DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now()
);

-- Create channels table
CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  stream_url text NOT NULL,
  category text DEFAULT 'Sports',
  quality text DEFAULT 'HD',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Public SELECT policies
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read channels" ON channels FOR SELECT USING (true);

-- Allow all operations via anon key (for admin panel with client-side Supabase)
CREATE POLICY "Anon insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update matches" ON matches FOR UPDATE USING (true);
CREATE POLICY "Anon delete matches" ON matches FOR DELETE USING (true);

CREATE POLICY "Anon insert channels" ON channels FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update channels" ON channels FOR UPDATE USING (true);
CREATE POLICY "Anon delete channels" ON channels FOR DELETE USING (true);
```

## 2. Seed Sample Data (Optional)

```sql
INSERT INTO matches (team1, team2, team1_flag, team2_flag, tournament, status, match_time, stream_url) VALUES
('Bangladesh', 'India', '🇧🇩', '🇮🇳', 'ICC T20 World Cup', 'live', NOW(), 'https://your-stream-url.m3u8'),
('Argentina', 'Brazil', '🇦🇷', '🇧🇷', 'Copa America', 'upcoming', NOW() + INTERVAL '2 hours', ''),
('Man United', 'Liverpool', '●', '●', 'Premier League', 'upcoming', NOW() + INTERVAL '5 hours', '');

INSERT INTO channels (name, category, quality, stream_url, is_active) VALUES
('Sony Sports HD', 'Sports', 'HD', 'https://your-stream.m3u8', true),
('Star Sports 1', 'Sports', 'HD', 'https://your-stream.m3u8', true),
('beIN Sports', 'Sports', 'HD', 'https://your-stream.m3u8', true),
('ESPN HD', 'Sports', 'HD', 'https://your-stream.m3u8', true);
```

## 3. Environment Variables for Vercel

Add these in: Vercel Dashboard → Your Project → Settings → Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://zoyxdpkrtuepimsxqrkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_RHGWOsoUvCfsr6FG0TdSIA_Nv6m8iIy
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhxkxhoy7
NEXT_PUBLIC_SITE_NAME=StreamFy
ADMIN_PASSWORD=shafi20299
```

## 4. Deploy to Vercel via GitHub

```bash
# 1. Initialize git and push to GitHub
cd /Users/mirzashafi/sproject/StreamFy
git init
git add .
git commit -m "Initial StreamFy build"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/streamfy.git
git push -u origin main

# 2. Import in Vercel
# - Go to https://vercel.com/new
# - Click "Import Git Repository"
# - Select your streamfy repo
# - Add all environment variables (step 3 above)
# - Click Deploy

# 3. After deploy, update metadataBase in app/layout.js:
# Change: new URL('https://streamfy.vercel.app')
# To your actual Vercel URL or custom domain
```

## 5. Local Development

```bash
cd /Users/mirzashafi/sproject/StreamFy
npm install
npm run dev
# → http://localhost:3000

# Admin panel: http://localhost:3000/admin
# Password: shafi20299
```

## 6. File Structure Created

```
StreamFy/
├── app/
│   ├── layout.js           # Root layout with Navbar + Footer
│   ├── globals.css         # Dark theme + animations
│   ├── loading.js          # Root loading skeleton
│   ├── page.js             # Home: live + upcoming matches + channels
│   ├── live/
│   │   ├── page.js         # Live matches (auto-refresh 30s)
│   │   └── loading.js
│   ├── matches/
│   │   ├── page.js         # All matches with filter + search
│   │   ├── loading.js
│   │   └── [id]/
│   │       ├── page.js     # Watch match + VideoPlayer
│   │       └── loading.js
│   ├── channels/
│   │   ├── page.js         # TV channels grid + category filter
│   │   ├── loading.js
│   │   └── [id]/
│   │       ├── page.js     # Watch channel + VideoPlayer
│   │       └── loading.js
│   └── admin/
│       └── page.js         # Password-protected CRUD dashboard
├── components/
│   ├── Navbar.js            # Fixed nav with mobile menu
│   ├── Footer.js
│   ├── MatchCard.js         # Match card with LIVE/UPCOMING badge
│   ├── ChannelCard.js       # Channel card with quality badge
│   ├── VideoPlayer.js       # HLS.js + iframe fallback
│   └── AdminTable.js        # Reusable table with edit/delete
├── lib/
│   └── supabase.js          # Supabase client
├── .env.local               # Your credentials (do not commit)
├── .env.example             # Template for others
├── jsconfig.json            # @/ path alias
├── next.config.js           # Image domains (Supabase + Cloudinary)
├── tailwind.config.js
└── package.json
```

## 7. Adding Real Streams

The admin panel at `/admin` (password: `shafi20299`) lets you:
- Add/edit/delete matches with stream URLs
- Add/edit/delete TV channels with stream URLs

Stream URL formats supported:
- **HLS (.m3u8)**: Loaded via HLS.js — `https://example.com/stream.m3u8`
- **Iframe**: Any other URL is embedded as `<iframe>` — supports YouTube, Dailymotion, etc.

For live sports streams, sources like:
- m3u8 direct links from broadcasters
- Streamtape, Doodstream, and similar iframe embeds
