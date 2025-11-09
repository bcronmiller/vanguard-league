# Vanguard League Platform

**VGI Trench — Submission-Only Ladder League**

The Vanguard League is a recurring submission-only competition series held in the **VGI Trench** (our single-mat pit/bowl). Each event offers **2–4 matches** per competitor for a **$20 entry**. **No judges. No points. No decisions.** If there’s no tap, it’s a **draw**. All submissions are legal except **no slams** (safety first).

Match outcomes (Win / Loss / Draw) are recorded and synced to **Rankade**, and ladder standings are **automatically sorted by weight class** and belt rank. A portion of every event’s entry fees contributes to a **season prize pool**, awarded to the **top-ranked competitor in each weight class** at the end of the season.

This platform adds:

* Weight class–based ranking pulled live from Rankade
* Belt rank metadata and athlete profiles
* Check-in + weigh-in workflow on event night
* Auto pairing & bracket generation (Swiss / single-elim / double-elim)
* One-mat scheduling and queueing for the Trench
* Result entry that immediately updates the ladder

---

## Core Rules (Public)

| Rule | Description |
|---|---|
| Match Type | **Submission-only** |
| Decisions | **None — if no tap, it’s a draw** |
| Judges | **None** |
| Submissions | **All submissions legal** (except slams prohibited) |
| Arena | **One mat**: The VGI Trench |
| Matches Per Event | 2–4 per competitor |
| Ranking | Ladder points (Win / Loss / Draw) |
| Season Prize | Top-ranked per weight class earns payout |

---

## Technical Goals

* Cloud-hosted frontend (never-down public ladder + brackets)
* Home-hosted backend (pairing engine, weigh-in, syncing)
* Live Rankade sync (pull rankings, push results)
* Internal DB with player metadata (belt, weight class history, etc.)
* Queue-driven writes to avoid Rankade API quota issues

---

## Proposed Architecture

**Frontend (Cloud / Reliable):**

* Next.js on Vercel or Cloudflare Pages
* Server-Side Rendering for public ladders & brackets
* Cached/Edge delivery so site stays up even if home server is offline

**Backend (Home Server):**

* FastAPI (Python) or Node.js Express
* Services:

  * Rankade Sync Worker
  * Weigh-In/Check-In Service
  * Pairing/Bracket Engine
  * Result Write Queue Processor

**Database:**

* Postgres (Supabase or Neon cloud-hosted)

**Caching / Degrade Gracefully:**

* If home server goes down → serve **last known leaderboard + brackets** from edge cache
* When home returns → resync automatically

---

## Data Model (Initial)

```
players(id, rankade_id, name, belt, team, photo_url, active)
weigh_ins(id, player_id, weight_kg, event_id, created_at)
weight_classes(id, name, min_kg, max_kg)
events(id, name, date, venue, status)
entries(id, event_id, player_id, weight_class_id, checked_in)
matches(id, event_id, a_player_id, b_player_id, result, method, duration_s, rankade_match_id)
rankings_snapshots(id, created_at, payload_json)
payouts(id, season, weight_class_id, winner_player_id, amount)
```

---

## MVP (Phase 1 — Get Running Fast)

1. Player profiles + belt + weight class assignments
2. Rankade sync (nightly + manual trigger)
3. Weight-class leaderboards (public page)
4. Event check-in + weigh-in tablet UI
5. Single elimination bracket generator
6. Match result entry → sync to Rankade → refresh leaderboard

---

## Phase 2 (After Initial Events)

* Swiss + double elimination
* Mat scheduling optimizations
* Streaming overlay integration
* Season payout auto calculation

---

# TODO (Development Roadmap)

### Immediate Setup

* [ ] Create GitHub repo
* [ ] Add this README.md
* [ ] Choose stack: **Next.js + FastAPI + Postgres**
* [ ] Create `.env.sample` (Rankade key/secret, DB URL)

### Data + Sync

* [ ] Write `rankade_sync.py` to pull players & rankings
* [ ] Build internal player table + mapping to Rankade IDs
* [ ] Store rankings snapshots for public display

### Web Frontend

* [ ] Create weight-class leaderboard page
* [ ] Create competitor profile pages

### Event Operations

* [ ] Check-in UI (search or QR lookup)
* [ ] Weigh-in screen → auto-assign weight class
* [ ] Bracket builder (single-elim first)
* [ ] One-mat event queue display (On Deck / Up Next)

### Result Entry

* [ ] Match result UI (win / draw / loss + method)
* [ ] Push results to Rankade API
* [ ] Show updated ladder instantly

### Season Management

* [ ] Track entry fees & prize pool
* [ ] Calculate season winners per weight class
* [ ] Export payout summary

---

# If You Want the Repo Scaffold Auto-Generated

If your CLI AI can **create project structure**, say:

```
Project Name: vanguard-league-platform
Folders:
  /frontend (Next.js)
  /backend (FastAPI)
  /db (migrations, schema)
  /scripts (sync + utilities)
```

Tell me what CLI tool you're using (e.g., **Ollama**, **npx create-next-app**, **bun**, **uv**, etc.)
and I’ll produce **exact commands** to:

✅ Scaffold
✅ Create `.env`
✅ Initialize git
✅ Push to GitHub
✅ Generate first issues for the roadmap

---

**You want to bootstrap this automatically, so just tell me:**

**What language do you want the backend in?**

* **Python (FastAPI)**
* **Node.js (Express)**
* **Go (Fiber / Chi)**

Reply with just one word:
**`python`**, **`node`**, or **`go`**.