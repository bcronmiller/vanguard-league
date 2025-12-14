import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';

export const dynamic = 'force-static';
export const revalidate = false;

interface Champion {
  weight_class_id: number;
  weight_class_name: string;
  player_id: number;
  player_name: string;
  photo_url: string | null;
  belt_rank: string | null;
  record: string;
  elo_delta?: number;
}

interface LeaderboardRow {
  player_id: number;
  player_name: string;
  photo_url: string | null;
  belt_rank: string | null;
  weight_class_id: number;
  wins: number;
  losses: number;
  draws: number;
  elo_rating: number;
  elo_delta?: number;
  rank: number;
}

interface SeasonData {
  season: number;
  title: string;
  event_ids: number[];
  totals: { matches: number; competitors: number };
  submission_counts: Record<string, number>;
  champions: Champion[];
  p4p_champion: Champion & { belt_rank: string | null };
  leaderboard_top10: LeaderboardRow[];
}

interface EventSummary {
  id: number;
  name: string;
  date?: string;
}

async function loadSeason(): Promise<SeasonData | null> {
  try {
    // Freeze Season 1 to a static snapshot so future data changes don’t alter this recap.
    const filePath = path.join(process.cwd(), 'public', 'data', 'season-1-final.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as SeasonData;
  } catch (err) {
    console.error('Failed to read season data', err);
    return null;
  }
}

async function loadEvents(): Promise<EventSummary[]> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'events.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as EventSummary[];
  } catch (err) {
    console.error('Failed to read events', err);
    return [];
  }
}

export default async function SeasonOnePage() {
  const data = await loadSeason();
  const events = await loadEvents();

  if (!data) {
    return (
      <div className="min-h-screen bg-white dark:bg-mbjj-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-4">Season 1</h1>
          <p className="text-gray-600 dark:text-gray-400">Season summary is unavailable.</p>
          <div className="mt-6">
            <Link href="/" className="text-mbjj-red font-semibold hover:underline">Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  const totalSubmissions = Object.values(data.submission_counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      <header className="bg-mbjj-dark text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-[0.2em]">Season Recap</p>
              <h1 className="text-3xl md:text-4xl font-heading font-bold">Vanguard League Season 1</h1>
              <p className="text-gray-300 mt-2 text-sm">Episodes 1-5 · Submission-only ladder</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/"
                className="px-4 py-2 bg-white text-mbjj-dark font-heading font-bold rounded-md shadow hover:shadow-md transition text-sm"
              >
                ← Home
              </Link>
              <Link
                href="/events"
                className="px-4 py-2 bg-mbjj-red text-white font-heading font-bold rounded-md shadow hover:bg-mbjj-accent-hover transition text-sm"
              >
                View Events
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
        {/* Events list first */}
        <section>
          <h2 className="text-xl font-heading font-bold mb-3 text-gray-900 dark:text-white">Season Events</h2>
          <div className="flex flex-wrap gap-2">
            {data.event_ids.map((id) => {
              const ev = events.find((e) => e.id === id);
              const label = ev ? ev.name : `Event #${id}`;
              return (
                <Link
                  key={id}
                  href={`/events/${id}`}
                  className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-heading text-sm hover:border-mbjj-red"
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Quick stats */}
        <section className="space-y-2">
          <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">Season Totals</h2>
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Matches</p>
              <p className="text-xl font-heading font-bold text-mbjj-red">{data.totals.matches}</p>
            </div>
            <div className="p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Competitors</p>
              <p className="text-xl font-heading font-bold text-mbjj-red">{data.totals.competitors}</p>
            </div>
            <div className="p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Submissions</p>
              <p className="text-xl font-heading font-bold text-mbjj-red">{totalSubmissions}</p>
            </div>
            <div className="p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Events</p>
              <p className="text-xl font-heading font-bold text-mbjj-red">{data.event_ids.length}</p>
            </div>
          </div>
        </section>

        {/* Champions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">Season Champions</h2>
            <span className="px-3 py-1 rounded-full text-xs bg-mbjj-red text-white font-semibold">Season 1</span>
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {data.champions.map((champ) => (
              <div
                key={champ.player_id}
                className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-2"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">{champ.weight_class_name}</p>
                <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span role="img" aria-label="trophy">🏆</span> {champ.player_name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {champ.record} · <span className="font-semibold">ΔELO {Math.round(champ.elo_delta ?? 0)}</span>
                </p>
                {champ.photo_url && (
                  <div className="mt-1">
                    <img
                      src={champ.photo_url}
                      alt={champ.player_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-mbjj-red"
                    />
                  </div>
                )}
              </div>
            ))}
            {data.p4p_champion && (
              <div className="p-3 rounded-lg bg-mbjj-dark text-white border border-gray-700 shadow-sm flex flex-col gap-2">
                <p className="text-xs text-gray-300">Pound-for-Pound</p>
                <h3 className="text-sm font-heading font-bold flex items-center gap-1.5">
                  <span role="img" aria-label="crown">👑</span> {data.p4p_champion.player_name}
                </h3>
                <p className="text-xs text-gray-200">
                  {data.p4p_champion.record} · <span className="font-semibold">ΔELO {Math.round(data.p4p_champion.elo_delta ?? 0)}</span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Submission breakdown */}
        <section>
          <h2 className="text-xl font-heading font-bold mb-3 text-gray-900 dark:text-white">Submission Breakdown</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(data.submission_counts).map(([name, count]) => {
                const pct = totalSubmissions ? Math.round((count / totalSubmissions) * 100) : 0;
                return (
                  <div key={name} className="flex items-center gap-2">
                    <div className="w-36 truncate text-xs text-gray-900 dark:text-white font-semibold">{name}</div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="h-2 rounded-full bg-mbjj-red" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-14 text-right text-[11px] text-gray-600 dark:text-gray-400">{count} ({pct}%)</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <h2 className="text-xl font-heading font-bold mb-3 text-gray-900 dark:text-white">Top Performers</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {data.leaderboard_top10.map((row) => (
              <div key={row.player_id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-heading font-bold text-mbjj-red">
                  #{row.rank}
                </div>
                {row.photo_url ? (
                  <img
                    src={row.photo_url}
                    alt={row.player_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-mbjj-red"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-sm">👤</div>
                )}
                <div className="flex-1">
                  <p className="font-heading font-bold text-base text-gray-900 dark:text-white">{row.player_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {row.wins}-{row.losses}-{row.draws} · ΔELO {Math.round(row.elo_delta ?? 0)} · WC #{row.weight_class_id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Events list */}
        <section>
          <h2 className="text-xl font-heading font-bold mb-3 text-gray-900 dark:text-white">Season Events</h2>
          <div className="flex flex-wrap gap-2">
            {data.event_ids.map((id) => {
              const ev = events.find((e) => e.id === id);
              const label = ev ? ev.name : `Event #${id}`;
              return (
                <Link
                  key={id}
                  href={`/events/${id}`}
                  className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-heading text-sm hover:border-mbjj-red"
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
