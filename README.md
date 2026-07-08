# StreamFy 🔴

A complete sports live streaming website built with **Next.js 14**, **Vanilla CSS**, and **Supabase**. Features live match streaming with auto channel switching, TV channels with dead channel filtering, admin panel, automatic stream health monitoring, and Telegram alerts.

**Live Demo:** [streamfy.mirzashafi.com](https://streamfy.mirzashafi.com)

---

## Features

- 🔴 **Live match streaming** with HLS.js (.m3u8) and iframe fallback
- 📺 **TV Channels** — auto-filters dead channels, shows only working ones in horizontal rows
- 🔀 **Multi-stream failover** — auto-skip to next channel if stream dies (12s timeout)
- 📡 **M3U Playlist integration** — 167 KB-TV channels, auto-checked for availability
- 🌍 **Bangladesh Time (BST)** — all match times shown in UTC+6, 12-hour format
- 🕐 **Live clock** — real-time ticking clock on the Matches page
- 📅 **Smart date filtering** — only today + future matches shown, old matches auto-hidden
- 🏆 **Sport sections** — Home has FIFA World Cup, Football, Cricket in horizontal scrollable rows
- ⏱️ **Auto-expiry** — football matches auto-expire after 3h, cricket after 8h
- 🤖 **Auto stream failover** — detects dead streams and finds replacements automatically
- 📱 **Telegram bot alerts** — get notified when streams go down or get fixed
- 🛡️ **Password-protected admin panel** — add/edit/delete matches and channels
- ⏱️ **Hourly cron job** via Vercel — checks all streams automatically
- 📊 **Stream logs** — full history of all stream events
- 🎨 **Custom favicon** — branded red/black icon
- 🌙 **Dark theme** — fully responsive mobile-first design

---

## Pages

| Route | Description |
|---|---|
| `/` | Home — Today's matches (all sports), FIFA WC section, Football, Cricket, Channels |
| `/live` | Live matches only — auto-refreshes every 30s, BST date filtered |
| `/matches` | All matches — filter by sport (WC/Football/Cricket) + status + search |
| `/matches/[id]` | Watch match — channel chooser, auto-skip dead channels, multi-stream |
| `/channels` | TV channels — only working (HTTPS) channels shown |
| `/channels/[id]` | Watch channel — HLS video player |
| `/watch` | Direct stream viewer via URL params |
| `/admin` | Password-protected dashboard — full CRUD for matches & channels |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Vanilla CSS |
| Database | Supabase (PostgreSQL) |
| Video | HLS.js + iframe embed |
| M3U Playlist | KB-TV GitHub playlist (167 channels) |
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

## Live Match Player

When a user opens a live match, they get a **full channel chooser** with:

- **DB Streams** (Stream 1/2/3 from admin panel) — shown first
- **M3U Channels** (from KB-TV playlist, sport-matched) — shown in scrollable row
- **Auto-skip on failure** — if a channel doesn't load within 12 seconds, it automatically switches to the next one
- **HTTPS filtering** — on HTTPS sites, HTTP-only streams are hidden (browser security)

---

## M3U Playlist & Dead Channel Filtering

StreamFy integrates the [KB-TV GitHub playlist](https://github.com/sanjoykb/-KB-TV-Playlist) with 167 channels.

**How dead channels are filtered:**
1. Server fetches the M3U playlist (cached 1 hour)
2. All 167 stream URLs are concurrently checked with a 2.5s HEAD request
3. Only channels that respond with HTTP 200/206 are returned
4. Result: ~79 working channels out of 167 total (varies daily)

The check runs automatically on every `/api/m3u-channels` request (hourly cache).

---

## Date Filtering (BST Timezone)

All match filters use **Bangladesh Standard Time (UTC+6)** midnight as the cutoff:

- Only **today's** and **future** matches are shown on home/live/matches pages
- Past matches (yesterday and older) are automatically hidden
- The cutoff resets at **midnight BST** (not UTC) so Bangladeshi users always see the right matches
- Old `live`/`upcoming` database rows from previous days never appear

---

## Home Page Sections

| Section | Contents |
|---|---|
| 📅 Today's Matches | All sports — live first, then upcoming, horizontal scrollable row |
| 🏆 FIFA World Cup 2026 | WC live + upcoming, horizontal row, links to `/matches?sport=worldcup` |
| ⚽ Football | Plain football matches, horizontal row |
| 🏏 Cricket | ICC, T20, Test matches, horizontal row |
| 📺 TV Channels | Active M3U channels in horizontal scrollable row |

---

## API Routes

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/admin-auth` | POST | None | Verify admin password server-side |
| `/api/check-streams` | GET | `Bearer CRON_SECRET` | Check all live streams, auto-fix dead ones |
| `/api/find-stream` | POST | None | Search IPTV sources for a stream URL |
| `/api/m3u-channels` | GET | None | M3U playlist channels (dead-filtered, cached 1h) |
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
│   ├── layout.js                    # Root layout + nav
│   ├── page.js                      # Home page (server, BST date filter, sport sections)
│   ├── live/page.js                 # Live matches (client, auto-refresh 30s)
│   ├── matches/page.js              # All matches — sport/status filters + search
│   ├── matches/[id]/page.js         # Watch match — channel chooser player
│   ├── channels/page.js             # TV channels — dead-channel filtered
│   ├── channels/[id]/page.js        # Watch channel
│   ├── watch/page.js                # Direct stream viewer
│   ├── admin/page.js                # Admin dashboard
│   └── api/
│       ├── admin-auth/route.js      # Server-side password check
│       ├── check-streams/route.js   # Cron stream checker
│       ├── find-stream/route.js     # Auto stream finder
│       ├── m3u-channels/route.js    # KB-TV playlist — dead-channel filter
│       └── telegram-webhook/route.js
├── components/
│   ├── Navbar.js
│   ├── MatchCard.js
│   ├── ChannelCard.js
│   ├── M3UChannelCard.js
│   ├── HomepageChannels.js          # Client component — M3U channels horizontal row
│   ├── LiveClock.js                 # Real-time ticking clock (BST)
│   ├── VideoPlayer.js               # HLS.js + iframe, 12s timeout, auto-skip
│   ├── LiveMatchPlayer.js           # Match player with channel chooser + auto-skip
│   └── ErrorPage.js
├── lib/
│   ├── supabase.js                  # Supabase client
│   ├── matchHelpers.js              # isMatchExpired(), getTodayISO() — BST timezone utils
│   ├── streamChecker.js             # URL health check
│   ├── autoStreamFinder.js          # Find replacement streams
│   ├── streamSources.js             # IPTV source parsers
│   └── telegramAlert.js             # Telegram notifications
├── app/icon.png                     # Custom favicon
├── .env.example
├── vercel.json                      # Cron: every hour
└── next.config.js                   # Image domains + security headers
```

---

## Environment Variables Reference

| Variable | Required | Browser | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | Supabase anon/public key |
| `NEXT_PUBLIC_SITE_NAME` | ✅ | ✅ | Site display name |
| `ADMIN_PASSWORD` | ✅ | ❌ | Admin panel password (server only) |
| `TELEGRAM_BOT_TOKEN` | ✅ | ❌ | Telegram bot token (server only) |
| `TELEGRAM_CHAT_ID` | ✅ | ❌ | Your Telegram user ID (server only) |
| `CRON_SECRET` | ✅ | ❌ | Secret to authorize cron endpoint |

---

## License

MIT
