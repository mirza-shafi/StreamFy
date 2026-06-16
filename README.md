# StreamFy 🔴

A complete sports live streaming website built with **Next.js 14**, **Tailwind CSS**, and **Supabase**. Features live match streaming, TV channels, admin panel, automatic stream health monitoring, and Telegram alerts.

**Live Demo:** [your-app.vercel.app](https://your-app.vercel.app)

---

## Features

- 🔴 **Live match streaming** with HLS.js (.m3u8) and iframe fallback
- 📺 **TV Channels** grid with category filtering
- 🤖 **Auto stream failover** — detects dead streams and finds replacements automatically
- 📱 **Telegram bot alerts** — get notified when streams go down or get fixed
- 🛡️ **Password-protected admin panel** — add/edit/delete matches and channels
- ⏱️ **Hourly cron job** via Vercel — checks all streams automatically
- 📊 **Stream logs** — full history of all stream events
- 🌙 **Dark theme** — fully responsive mobile-first design

---

## Pages

| Route | Description |
|---|---|
| `/` | Home — live matches, upcoming matches, featured channels |
| `/live` | Live matches only — auto-refreshes every 30s |
| `/matches` | All matches with filter (Live/Upcoming/Finished) + search |
| `/matches/[id]` | Watch match — video player with multi-stream failover |
| `/channels` | TV channels grid with category filter |
| `/channels/[id]` | Watch channel — video player |
| `/admin` | Password-protected dashboard — full CRUD |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Video | HLS.js + iframe embed |
| Image CDN | Cloudinary |
| Deployment | Vercel |
| Bot | Telegram Bot API |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/mirza-shafi/StreamFy.git
cd StreamFy
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_SITE_NAME=StreamFy
ADMIN_PASSWORD=your_admin_password
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
CRON_SECRET=your_secret_string
```

### 3. Set up Supabase

Run this SQL in your **Supabase SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team1 text NOT NULL,
  team2 text NOT NULL,
  team1_flag text,
  team2_flag text,
  tournament text,
  match_time timestamptz,
  stream_url text,
  stream_url_2 text,
  stream_url_3 text,
  backup_stream_url text,
  stream_status text DEFAULT 'unknown',
  stream_last_checked timestamptz,
  stream_auto_updated boolean DEFAULT false,
  status text DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  stream_url text NOT NULL,
  stream_url_2 text,
  stream_url_3 text,
  category text DEFAULT 'Sports',
  quality text DEFAULT 'HD',
  is_active boolean DEFAULT true,
  stream_status text DEFAULT 'unknown',
  stream_last_checked timestamptz,
  stream_auto_updated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stream_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  channel_id uuid REFERENCES channels(id) ON DELETE SET NULL,
  event_type text,
  old_url text,
  new_url text,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_channels" ON channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_logs" ON stream_logs FOR ALL USING (true) WITH CHECK (true);
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

Admin panel: `http://localhost:3000/admin`

---

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/StreamFy.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Add all environment variables (same as `.env.local`)
4. Click **Deploy**

### 3. Connect Telegram webhook

After deploy, open this URL once in your browser:

```
https://api.telegram.org/bot{YOUR_TOKEN}/setWebhook?url=https://YOUR-APP.vercel.app/api/telegram-webhook&secret_token={YOUR_CRON_SECRET}
```

---

## API Routes

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/admin-auth` | POST | None | Verify admin password server-side |
| `/api/check-streams` | GET | `Bearer CRON_SECRET` | Check all live streams, auto-fix dead ones |
| `/api/find-stream` | POST | None | Search IPTV sources for a stream URL |
| `/api/telegram-webhook` | POST | Telegram secret | Handle bot commands |

### Test stream check manually

```bash
curl https://your-app.vercel.app/api/check-streams \
  -H "Authorization: Bearer your_cron_secret"
```

Response:
```json
{ "checked": 5, "fixed": 1, "dead": 0, "alive": 4, "timestamp": "..." }
```

---

## Telegram Bot Commands

Message your bot on Telegram:

| Command | Response |
|---|---|
| `/status` | Live matches count, active channels, dead streams |
| `/listdead` | List all matches/channels with dead streams |
| `/check` | Instructions to trigger manual check |
| `/help` | Show all commands |

---

## Automatic Stream Monitoring

The system runs every hour via Vercel cron:

```
Every hour → /api/check-streams
    ↓
For each live match + active channel:
    → Check if stream URL responds
    ↓
  ALIVE → mark stream_status = "live"
  DEAD  → search IPTV-org for replacement
        → Found: update URL + send Telegram "✓ STREAM FIXED"
        → Not found: mark dead + send Telegram "⚠️ STREAM NOT FOUND"
```

Stream sources searched (in order):
1. Backup URLs already saved in database (`stream_url_2`, `stream_url_3`)
2. [iptv-org](https://github.com/iptv-org/iptv) JSON API
3. Country-specific M3U playlists (BD, IN, PK, GB)

---

## Project Structure

```
StreamFy/
├── app/
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Home page (server component)
│   ├── live/page.js              # Live matches (client, auto-refresh)
│   ├── matches/page.js           # All matches with filters
│   ├── matches/[id]/page.js      # Watch match
│   ├── channels/page.js          # TV channels
│   ├── channels/[id]/page.js     # Watch channel
│   ├── admin/page.js             # Admin dashboard
│   └── api/
│       ├── admin-auth/route.js   # Server-side password check
│       ├── check-streams/route.js # Cron stream checker
│       ├── find-stream/route.js  # Auto stream finder
│       └── telegram-webhook/route.js
├── components/
│   ├── Navbar.js
│   ├── Footer.js
│   ├── MatchCard.js
│   ├── ChannelCard.js
│   ├── VideoPlayer.js            # HLS.js + iframe, multi-stream failover
│   ├── AdminTable.js
│   └── ErrorPage.js
├── lib/
│   ├── supabase.js               # Supabase client
│   ├── streamChecker.js          # URL health check
│   ├── autoStreamFinder.js       # Find replacement streams
│   ├── streamSources.js          # IPTV source parsers
│   └── telegramAlert.js          # Telegram notifications
├── .env.example
├── vercel.json                   # Cron: every hour
└── next.config.js                # Image domains + security headers
```

---

## Environment Variables Reference

| Variable | Required | Browser | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | Supabase anon/public key |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ | ✅ | Cloudinary cloud name |
| `NEXT_PUBLIC_SITE_NAME` | ✅ | ✅ | Site display name |
| `ADMIN_PASSWORD` | ✅ | ❌ | Admin panel password (server only) |
| `TELEGRAM_BOT_TOKEN` | ✅ | ❌ | Telegram bot token (server only) |
| `TELEGRAM_CHAT_ID` | ✅ | ❌ | Your Telegram user ID (server only) |
| `CRON_SECRET` | ✅ | ❌ | Secret to authorize cron endpoint |

---

## License

MIT
