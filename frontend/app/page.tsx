'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface Player {
  id: number;
  name: string;
  bjj_belt_rank?: string;
  weight?: number | null;
  weight_class_name: string | null;
  elo_rating: number;
  initial_elo_rating: number;
  photo_url?: string | null;
  academy?: string | null;
}

interface LadderStanding {
  player: Player;
  wins: number;
  losses: number;
  draws: number;
}

interface LadderData {
  overall: LadderStanding[];
  lightweight: LadderStanding[];
  middleweight: LadderStanding[];
  heavyweight: LadderStanding[];
}

interface Event {
  id: number;
  name: string;
}

interface AcademyFighter {
  id: number;
  name: string;
  belt_rank: string;
  elo_rating: number;
  elo_change: number;
  photo_url: string | null;
}

interface Academy {
  academy_name: string;
  fighter_count: number;
  climber_count: number;
  avg_elo_change: number;
  total_elo_change: number;
  total_matches: number;
  fighters: AcademyFighter[];
  logo_url: string | null;
  website: string | null;
}

export default function Home() {
  const apiUrl = config.apiUrl;
  const readOnly = config.readOnly;
  const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';

  const [stats, setStats] = useState({ players: 0, matches: 0 });
  const [ladderData, setLadderData] = useState<LadderData>({
    overall: [],
    lightweight: [],
    middleweight: [],
    heavyweight: []
  });
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const eventsEndpoint = isStatic ? '/data/events.json' : `${apiUrl}/api/events`;
      const playersEndpoint = isStatic ? '/data/players.json' : `${apiUrl}/api/players`;
      const lwEndpoint = isStatic ? '/data/ladder-lightweight.json' : `${apiUrl}/api/ladder/weight-class/Lightweight`;
      const mwEndpoint = isStatic ? '/data/ladder-middleweight.json' : `${apiUrl}/api/ladder/weight-class/Middleweight`;
      const hwEndpoint = isStatic ? '/data/ladder-heavyweight.json' : `${apiUrl}/api/ladder/weight-class/Heavyweight`;
      const overallEndpoint = isStatic ? '/data/ladder-overall.json' : `${apiUrl}/api/ladder/overall`;
      const academiesEndpoint = isStatic ? '/data/academy-rankings.json' : `${apiUrl}/api/academies/rankings`;

      // Fetch events, weight class ladders, overall ladder, academies, and all players in parallel
      const [eventsRes, lwRes, mwRes, hwRes, overallRes, academiesRes, playersRes] = await Promise.all([
        fetch(eventsEndpoint, { cache: 'no-store' }),
        fetch(lwEndpoint, { cache: 'no-store' }),
        fetch(mwEndpoint, { cache: 'no-store' }),
        fetch(hwEndpoint, { cache: 'no-store' }),
        fetch(overallEndpoint, { cache: 'no-store' }),
        fetch(academiesEndpoint, { cache: 'no-store' }),
        fetch(playersEndpoint, { cache: 'no-store' })
      ]);

      // Process matches from all events in parallel
      if (eventsRes.ok) {
        const events: Event[] = await eventsRes.json();

        // Fetch all event matches in parallel
        const matchPromises = events.map(async (event) => {
          try {
            const matchEndpoint = isStatic
              ? `/data/matches-event-${event.id}.json`
              : `${apiUrl}/api/events/${event.id}/matches`;
            const matchRes = await fetch(matchEndpoint, { cache: 'no-store' });
            if (matchRes.ok) {
              const data = await matchRes.json();
              return Array.isArray(data) ? data.length : 0;
            }
            return 0;
          } catch {
            return 0;
          }
        });

        const matchCounts = await Promise.all(matchPromises);
        const totalMatches = matchCounts.reduce((sum, count) => sum + count, 0);
        setStats(prev => ({ ...prev, matches: totalMatches }));
      }

      // Process weight class ladder data
      const convertLadderEntry = (entry: any): LadderStanding => ({
        player: {
          id: entry.player_id,
          name: entry.player_name,
          bjj_belt_rank: entry.belt_rank,
          weight: null,
          weight_class_name: null,
          elo_rating: entry.elo_rating,
          initial_elo_rating: entry.initial_elo_rating,
          photo_url: entry.photo_url,
          academy: null
        },
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws
      });

      const lightweight: LadderStanding[] = [];
      const middleweight: LadderStanding[] = [];
      const heavyweight: LadderStanding[] = [];
      const overall: LadderStanding[] = [];

      if (lwRes.ok) {
        const lwData = await lwRes.json();
        const standings = isStatic ? lwData.standings : lwData.standings || [];
        lightweight.push(...standings.map(convertLadderEntry));
      }

      if (mwRes.ok) {
        const mwData = await mwRes.json();
        const standings = isStatic ? mwData.standings : mwData.standings || [];
        middleweight.push(...standings.map(convertLadderEntry));
      }

      if (hwRes.ok) {
        const hwData = await hwRes.json();
        const standings = isStatic ? hwData.standings : hwData.standings || [];
        heavyweight.push(...standings.map(convertLadderEntry));
      }

      // Load overall ladder (already sorted by ELO improvement)
      if (overallRes.ok) {
        const overallData = await overallRes.json();
        if (Array.isArray(overallData)) {
          overall.push(...overallData.map((entry: any) => ({
            player: {
              id: entry.player.id,
              name: entry.player.name,
              bjj_belt_rank: entry.player.bjj_belt_rank,
              weight: entry.player.weight,
              weight_class_name: entry.player.weight_class_name,
              elo_rating: entry.player.elo_rating,
              initial_elo_rating: entry.player.initial_elo_rating,
              photo_url: entry.player.photo_url,
              academy: entry.player.academy
            },
            wins: entry.wins,
            losses: entry.losses,
            draws: entry.draws
          })));
        }
      }

      setLadderData({
        overall,
        lightweight,
        middleweight,
        heavyweight
      });

      // Count total registered fighters (all players)
      if (playersRes.ok) {
        const allPlayers = await playersRes.json();
        setStats(prev => ({ ...prev, players: allPlayers.length }));
      }

      // Load academy rankings
      if (academiesRes.ok) {
        const academyData = await academiesRes.json();
        if (academyData.academies && Array.isArray(academyData.academies)) {
          setAcademies(academyData.academies);
        }
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-mbjj-dark">
      {/* Header with VanGuard Gym branding */}
      <header className="bg-mbjj-dark text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            {/* VGG Logo */}
            <div className="flex justify-center mb-4">
              <img
                src="/vgg-logo.png"
                alt="VanGuard Gym"
                className="h-24 md:h-32 w-auto"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-2">
              VANGUARD LEAGUE
            </h1>
            <div className="h-1 w-32 bg-mbjj-red mx-auto mb-4"></div>
            <p className="text-xl md:text-2xl font-heading text-gray-300">
              VGI TRENCH — SUBMISSION-ONLY LADDER
            </p>
            <p className="text-lg text-gray-400 mt-2">
              <a
                href="https://maps.google.com/?q=9414+Center+Point+Ln,+Manassas,+VA+20110"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-mbjj-red transition inline-flex items-center gap-1 justify-center"
              >
                <span>📍</span> at VanGuard Gym
              </a>
            </p>
          </div>
        </div>
      </header>

      {/* Hero Stats Section */}
      <section className="bg-gradient-to-r from-mbjj-red to-mbjj-accent-light text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6 bg-black/20 rounded-lg backdrop-blur">
              <div className="text-6xl font-heading font-bold mb-2">{stats.players}</div>
              <div className="text-xl font-heading uppercase tracking-wide">Registered Fighters</div>
              <a href="/players" className="inline-block mt-4 px-6 py-2 bg-white text-mbjj-red font-heading font-bold rounded hover:bg-gray-100 transition">
                VIEW ROSTER →
              </a>
            </div>
            <div className="text-center p-6 bg-black/20 rounded-lg backdrop-blur">
              <div className="text-6xl font-heading font-bold mb-2">{stats.matches}</div>
              <div className="text-xl font-heading uppercase tracking-wide">Matches Recorded</div>
              <div className="mt-4 text-gray-200">
                Since November 2025
              </div>
            </div>
            <div className="text-center p-6 bg-black/20 rounded-lg backdrop-blur">
              <div className="text-6xl font-heading font-bold mb-2">📹</div>
              <div className="text-xl font-heading uppercase tracking-wide">Events</div>
              <a href="/schedule" className="inline-block mt-4 px-6 py-2 bg-white text-mbjj-red font-heading font-bold rounded hover:bg-gray-100 transition">
                VIEW SCHEDULE →
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* About Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-heading font-bold text-center mb-8 text-gray-900 dark:text-white">
            COMPETITION FORMAT
          </h2>
          <div className="h-1 w-24 bg-mbjj-red mx-auto mb-12"></div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border-t-4 border-mbjj-red">
              <div className="text-4xl text-mbjj-red mb-4 text-center">👨‍⚖️</div>
              <h3 className="text-2xl font-heading font-bold mb-3 text-center">NO JUDGES</h3>
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Pure submission-only competition. Tap or draw. No points, no decisions.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border-t-4 border-mbjj-blue">
              <div className="text-4xl text-mbjj-blue mb-4 text-center">⚖️</div>
              <h3 className="text-2xl font-heading font-bold mb-3 text-center">WEIGHT CLASSES</h3>
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Automatic ladder rankings by weight class. Rankings are handicapped by belt rank.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border-t-4 border-mbjj-red">
              <div className="text-4xl text-mbjj-red mb-4 text-center">💰</div>
              <h3 className="text-2xl font-heading font-bold mb-3 text-center">SEASON PRIZES</h3>
              <p className="text-gray-700 dark:text-gray-300 text-center mb-3">
                Top-ranked fighters earn from the season prize pool.
              </p>
              <div className="text-center">
                <a
                  href="/season-rules"
                  className="text-mbjj-blue hover:text-mbjj-red font-bold text-sm transition"
                >
                  See Rules →
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 max-w-3xl mx-auto text-center bg-mbjj-dark text-white p-8 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-heading font-bold mb-3">INNOVATIVE ELO RANKING SYSTEM</h3>
            <p className="text-gray-300 mb-4">
              Our custom ELO system accounts for belt rank, creating fair matchups and meaningful rankings.
              Lower belts gain more points for wins, while higher belts prove their skill against expectations.
            </p>
            <a
              href="/rankings-explained"
              className="inline-block bg-mbjj-red hover:bg-mbjj-accent-light text-white font-heading font-bold px-6 py-3 rounded-lg transition"
            >
              LEARN HOW RANKINGS WORK →
            </a>
          </div>
        </section>

        {/* Season Prize Pool Rules Summary */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-8 shadow-lg border-l-4 border-yellow-500">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-5xl">💰</div>
              <div className="flex-1">
                <h3 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-3">
                  SEASON PRIZE POOL ELIGIBILITY
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                  Each season runs for <strong>6 events over 3 months</strong>. To be eligible for prize pool payouts, fighters must meet BOTH requirements:
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-mbjj-blue">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📅</span>
                      <h4 className="font-heading font-bold text-lg">Attend 3+ Events</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Compete in at least 3 of 6 events
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-mbjj-red">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🥊</span>
                      <h4 className="font-heading font-bold text-lg">8+ Matches</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Complete at least 8 total matches
                    </p>
                  </div>
                </div>

                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                    <strong>Weight Class Prizes:</strong> To be eligible for a specific division's prize, you must have at least 4 matches in that division and more matches there than any other division.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    <strong>Not eligible?</strong> You can still compete! Late joiners and those building their record are welcome to compete for experience, skill development, and exposure. Joining late is valuable for gaining mat time and preparing for future seasons.
                  </p>
                </div>

                <div className="text-center">
                  <a
                    href="/season-rules"
                    className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-heading font-bold px-8 py-3 rounded-lg transition shadow-md"
                  >
                    VIEW FULL RULES & POLICIES →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pre-Registration CTA */}
        <section className="mb-16">
          <div className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border-t-4 border-mbjj-red">
            <h3 className="text-2xl font-heading font-bold mb-3 text-gray-900 dark:text-white">
              INTERESTED IN COMPETING?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Pre-register for the next event. $20 entry • 2-4 matches per night • Season prize pool
            </p>
            <a
              href="https://forms.gle/2HzZfk8VuGBVNfnx5"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-mbjj-red hover:bg-mbjj-accent-light text-white font-heading font-bold text-lg px-8 py-3 rounded-lg transition shadow-md"
            >
              PRE-REGISTER FOR NEXT EVENT →
            </a>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Pre-registration only • Not a firm commitment
            </p>
          </div>
        </section>

        {/* Event Management Navigation - Hidden in read-only mode */}
        {!readOnly && (
          <section className="bg-mbjj-dark text-white rounded-lg p-12 mb-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-heading font-bold mb-2 text-center">
                EVENT MANAGEMENT
              </h2>
              <p className="text-center text-gray-400 mb-8">
                VGI Trench Submission-Only Competition Series
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Events */}
                <a href="/events" className="bg-white/10 hover:bg-white/20 border-2 border-mbjj-red rounded-lg p-8 text-center transition group">
                  <div className="text-5xl mb-4">📅</div>
                  <h3 className="text-2xl font-heading font-bold mb-2 group-hover:text-mbjj-accent-light">
                    EVENTS
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Create and manage competition events
                  </p>
                </a>

                {/* Players */}
                <a href="/players" className="bg-white/10 hover:bg-white/20 border-2 border-mbjj-blue rounded-lg p-8 text-center transition group">
                  <div className="text-5xl mb-4">👥</div>
                  <h3 className="text-2xl font-heading font-bold mb-2 group-hover:text-mbjj-accent-light">
                    PLAYERS
                  </h3>
                  <p className="text-gray-300 text-sm">
                    View complete roster and rankings
                  </p>
                </a>

                {/* Register Fighter */}
                <a href="/register" className="bg-white/10 hover:bg-white/20 border-2 border-mbjj-accent-light rounded-lg p-8 text-center transition group">
                  <div className="text-5xl mb-4">➕</div>
                  <h3 className="text-2xl font-heading font-bold mb-2 group-hover:text-mbjj-accent-light">
                    REGISTER
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Add new fighter to the roster
                  </p>
                </a>

                {/* Quick Access */}
                <a href="/events/2/checkin" className="bg-white/10 hover:bg-white/20 border-2 border-mbjj-red rounded-lg p-8 text-center transition group">
                  <div className="text-5xl mb-4">⚡</div>
                  <h3 className="text-2xl font-heading font-bold mb-2 group-hover:text-mbjj-accent-light">
                    VGL 2
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Quick access to Friday's event
                  </p>
                </a>
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-400 text-sm">
                  $20 entry • 2-4 matches per fighter • Single mat at the VGI Trench
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Pound-for-Pound Champion */}
        <section className="mb-12">
          <h2 className="text-4xl font-heading font-bold text-center mb-2 text-gray-900 dark:text-white">
            POUND-FOR-POUND #1
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-sm">
            Overall rankings across all weight classes
          </p>
          <div className="max-w-2xl mx-auto">
            <a href="/ladder/overall" className="block bg-gradient-to-r from-yellow-400 to-yellow-600 dark:from-yellow-600 dark:to-yellow-800 rounded-lg shadow-2xl border-4 border-yellow-500 overflow-hidden hover:shadow-3xl transition group transform hover:scale-105">
              <div className="bg-yellow-600 dark:bg-yellow-900 text-white p-6">
                <h3 className="font-heading font-bold text-2xl text-center">OVERALL LADDER</h3>
                <p className="text-center text-sm mt-1">All fighters, all divisions</p>
              </div>
              <div className="p-8 bg-white dark:bg-gray-800">
                {ladderData.overall.length > 0 ? (
                  <div className="text-center">
                    <div className="text-8xl mb-4">👑</div>
                    <div className="font-heading font-bold text-3xl text-gray-900 dark:text-white group-hover:text-yellow-600">
                      {ladderData.overall[0].player.name.replace('*', '')}
                    </div>
                    <div className="text-lg text-gray-600 dark:text-gray-400 mt-3">
                      {ladderData.overall[0].wins}-{ladderData.overall[0].losses}-{ladderData.overall[0].draws} • <span className={
                        (ladderData.overall[0].player.elo_rating - ladderData.overall[0].player.initial_elo_rating) >= 0
                          ? 'text-green-600 dark:text-green-400 font-bold'
                          : 'text-red-600 dark:text-red-400 font-bold'
                      }>
                        {(ladderData.overall[0].player.elo_rating - ladderData.overall[0].player.initial_elo_rating) >= 0 ? '+' : ''}
                        {Math.round(ladderData.overall[0].player.elo_rating - ladderData.overall[0].player.initial_elo_rating)}
                      </span> ({Math.round(ladderData.overall[0].player.elo_rating || 0)})
                    </div>
                    <div className="mt-6 text-yellow-600 dark:text-yellow-400 font-heading font-bold text-lg group-hover:underline">
                      VIEW FULL POUND-FOR-POUND LADDER →
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No fighters yet</p>
                )}
              </div>
            </a>
          </div>
        </section>

        {/* Current Champions */}
        <section>
          <h2 className="text-3xl font-heading font-bold text-center mb-2 text-gray-900 dark:text-white">
            WEIGHT CLASS #1 RANKED FIGHTERS
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-sm">
            Rankings based on performance vs. expectations, accounting for belt rank
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Lightweight */}
            <a href="/ladder/lightweight" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-t-4 border-mbjj-red overflow-hidden hover:shadow-2xl transition group">
              <div className="bg-mbjj-red text-white p-4">
                <h3 className="font-heading font-bold text-xl text-center">LIGHTWEIGHT</h3>
                <p className="text-center text-xs">Under 170 lbs</p>
              </div>
              <div className="p-6">
                {ladderData.lightweight.length > 0 ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥇</div>
                    <div className="font-heading font-bold text-xl text-gray-900 dark:text-white group-hover:text-mbjj-red">
                      {ladderData.lightweight[0].player.name.replace('*', '')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {ladderData.lightweight[0].wins}-{ladderData.lightweight[0].losses}-{ladderData.lightweight[0].draws} • <span className={
                        (ladderData.lightweight[0].player.elo_rating - ladderData.lightweight[0].player.initial_elo_rating) >= 0
                          ? 'text-green-600 dark:text-green-400 font-bold'
                          : 'text-red-600 dark:text-red-400 font-bold'
                      }>
                        {(ladderData.lightweight[0].player.elo_rating - ladderData.lightweight[0].player.initial_elo_rating) >= 0 ? '+' : ''}
                        {Math.round(ladderData.lightweight[0].player.elo_rating - ladderData.lightweight[0].player.initial_elo_rating)}
                      </span> ({Math.round(ladderData.lightweight[0].player.elo_rating || 0)})
                    </div>
                    <div className="mt-4 text-mbjj-blue font-heading font-bold group-hover:underline">
                      VIEW FULL LADDER →
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No fighters yet</p>
                )}
              </div>
            </a>

            {/* Middleweight */}
            <a href="/ladder/middleweight" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-t-4 border-mbjj-blue overflow-hidden hover:shadow-2xl transition group">
              <div className="bg-mbjj-blue text-white p-4">
                <h3 className="font-heading font-bold text-xl text-center">MIDDLEWEIGHT</h3>
                <p className="text-center text-xs">170-200 lbs</p>
              </div>
              <div className="p-6">
                {ladderData.middleweight.length > 0 ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥇</div>
                    <div className="font-heading font-bold text-xl text-gray-900 dark:text-white group-hover:text-mbjj-blue">
                      {ladderData.middleweight[0].player.name.replace('*', '')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {ladderData.middleweight[0].wins}-{ladderData.middleweight[0].losses}-{ladderData.middleweight[0].draws} • <span className={
                        (ladderData.middleweight[0].player.elo_rating - ladderData.middleweight[0].player.initial_elo_rating) >= 0
                          ? 'text-green-600 dark:text-green-400 font-bold'
                          : 'text-red-600 dark:text-red-400 font-bold'
                      }>
                        {(ladderData.middleweight[0].player.elo_rating - ladderData.middleweight[0].player.initial_elo_rating) >= 0 ? '+' : ''}
                        {Math.round(ladderData.middleweight[0].player.elo_rating - ladderData.middleweight[0].player.initial_elo_rating)}
                      </span> ({Math.round(ladderData.middleweight[0].player.elo_rating || 0)})
                    </div>
                    <div className="mt-4 text-mbjj-blue font-heading font-bold group-hover:underline">
                      VIEW FULL LADDER →
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No fighters yet</p>
                )}
              </div>
            </a>

            {/* Heavyweight */}
            <a href="/ladder/heavyweight" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-t-4 border-mbjj-red overflow-hidden hover:shadow-2xl transition group">
              <div className="bg-mbjj-red text-white p-4">
                <h3 className="font-heading font-bold text-xl text-center">HEAVYWEIGHT</h3>
                <p className="text-center text-xs">Over 200 lbs</p>
              </div>
              <div className="p-6">
                {ladderData.heavyweight.length > 0 ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥇</div>
                    <div className="font-heading font-bold text-xl text-gray-900 dark:text-white group-hover:text-mbjj-red">
                      {ladderData.heavyweight[0].player.name.replace('*', '')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {ladderData.heavyweight[0].wins}-{ladderData.heavyweight[0].losses}-{ladderData.heavyweight[0].draws} • <span className={
                        (ladderData.heavyweight[0].player.elo_rating - ladderData.heavyweight[0].player.initial_elo_rating) >= 0
                          ? 'text-green-600 dark:text-green-400 font-bold'
                          : 'text-red-600 dark:text-red-400 font-bold'
                      }>
                        {(ladderData.heavyweight[0].player.elo_rating - ladderData.heavyweight[0].player.initial_elo_rating) >= 0 ? '+' : ''}
                        {Math.round(ladderData.heavyweight[0].player.elo_rating - ladderData.heavyweight[0].player.initial_elo_rating)}
                      </span> ({Math.round(ladderData.heavyweight[0].player.elo_rating || 0)})
                    </div>
                    <div className="mt-4 text-mbjj-blue font-heading font-bold group-hover:underline">
                      VIEW FULL LADDER →
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No fighters yet</p>
                )}
              </div>
            </a>
          </div>
        </section>

        {/* Academy Rankings */}
        <section className="mt-16">
          <h2 className="text-3xl font-heading font-bold text-center mb-2 text-gray-900 dark:text-white">
            ACADEMY RANKINGS
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-sm">
            Ranked by average ELO increase of improving fighters only
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {academies.map((academy, idx) => (
              <div key={academy.academy_name} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-t-4 border-mbjj-blue overflow-hidden hover:shadow-2xl transition">
                <div className="bg-gradient-to-r from-mbjj-blue to-mbjj-accent-light text-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-heading font-bold text-lg">
                        {academy.academy_name}
                      </h3>
                      <p className="text-xs text-gray-200">
                        {academy.fighter_count} fighter{academy.fighter_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {academy.logo_url && (
                      <img
                        src={academy.logo_url}
                        alt={academy.academy_name}
                        className="w-12 h-12 rounded-full bg-white p-1 object-contain"
                      />
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="text-center mb-3">
                      <div className={`text-4xl font-heading font-bold ${
                        academy.climber_count > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {academy.climber_count > 0 ? '+' : ''}
                        {academy.avg_elo_change.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Avg ELO Increase
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {academy.climber_count > 0 ? (
                          <span>{academy.climber_count} climber{academy.climber_count !== 1 ? 's' : ''}</span>
                        ) : (
                          <span className="italic">No climbers yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top 3 Fighters */}
                  <div className="space-y-2">
                    <div className="text-xs font-heading font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
                      Top Fighters
                    </div>
                    {academy.fighters
                      .sort((a, b) => b.elo_change - a.elo_change)
                      .slice(0, 3)
                      .map((fighter, fighterIdx) => (
                        <div key={fighter.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {fighter.photo_url ? (
                              <img
                                src={fighter.photo_url}
                                alt={fighter.name}
                                className="w-6 h-6 rounded-full border border-gray-300 object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                                {fighter.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                              {fighter.name.split(' ')[0]} {fighter.name.split(' ').slice(-1)[0].charAt(0)}.
                            </span>
                          </div>
                          <span className={`font-heading font-bold ${
                            fighter.elo_change >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {fighter.elo_change >= 0 ? '+' : ''}{Math.round(fighter.elo_change)}
                          </span>
                        </div>
                      ))}
                  </div>

                  {academy.website && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={academy.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mbjj-blue hover:text-mbjj-red text-xs font-heading font-bold transition"
                      >
                        Visit Website →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="/academies"
              className="inline-block bg-mbjj-blue hover:bg-mbjj-accent-light text-white font-heading font-bold px-8 py-3 rounded-lg transition shadow-md"
            >
              VIEW FULL ACADEMY RANKINGS →
            </a>
          </div>
        </section>

        {/* Sponsors Section */}
        <section className="mt-16">
          <h2 className="text-3xl font-heading font-bold text-center mb-8 text-gray-900 dark:text-white">
            OUR SPONSORS
          </h2>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {/* Neff Bros. Stone */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-blue hover:shadow-xl transition">
                <div className="bg-mbjj-dark text-white p-4 text-center">
                  <h4 className="text-2xl font-heading font-bold">NEFF BROS. STONE</h4>
                </div>
                <div className="p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    Pavers, Walls, Stone & Aggregates
                  </p>
                  <a
                    href="https://neffbrothersstone.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-mbjj-blue hover:text-mbjj-red font-heading font-bold text-sm transition"
                  >
                    Visit Website →
                  </a>
                </div>
              </div>

              {/* Newbold Construction */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-blue hover:shadow-xl transition">
                <div className="bg-mbjj-dark text-white p-4 text-center">
                  <h4 className="text-2xl font-heading font-bold">NEWBOLD CONSTRUCTION</h4>
                </div>
                <div className="p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Professional Construction Services
                  </p>
                </div>
              </div>

              {/* Halse Construction */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-blue hover:shadow-xl transition">
                <div className="bg-mbjj-dark text-white p-4 text-center">
                  <h4 className="text-2xl font-heading font-bold">HALSE CONSTRUCTION</h4>
                </div>
                <div className="p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Quality Construction Services
                  </p>
                </div>
              </div>

              {/* Game Day Men's Health */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-blue hover:shadow-xl transition">
                <div className="bg-mbjj-dark text-white p-4 text-center">
                  <h4 className="text-2xl font-heading font-bold">GAME DAY MEN'S HEALTH</h4>
                </div>
                <div className="p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    Men's Health & Wellness - Manassas
                  </p>
                  <a
                    href="https://pdg.gamedaymenshealth.com/why-gmh-northeast-raleigh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-mbjj-blue hover:text-mbjj-red font-heading font-bold text-sm transition"
                  >
                    Learn More →
                  </a>
                </div>
              </div>

              {/* Attn2DetailMercantile */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-blue hover:shadow-xl transition">
                <div className="bg-mbjj-dark text-white p-4 text-center">
                  <h4 className="text-2xl font-heading font-bold">ATTN2DETAIL MERCANTILE</h4>
                </div>
                <div className="p-4 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    Veteran-Owned Custom Knives
                  </p>
                  <a
                    href="https://attn2detailmercantile.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-mbjj-blue hover:text-mbjj-red font-heading font-bold text-sm transition"
                  >
                    Visit Website →
                  </a>
                </div>
              </div>
            </div>

            {/* View All Sponsors Link */}
            <div className="text-center mt-8">
              <a
                href="/sponsors"
                className="inline-block bg-mbjj-blue hover:bg-mbjj-accent-light text-white font-heading font-bold px-8 py-3 rounded-lg transition shadow-md"
              >
                View All Sponsors
              </a>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-mbjj-dark text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="font-heading text-lg mb-2">VANGUARD LEAGUE</p>
          <p className="text-gray-400">
            Hosted at{' '}
            <a
              href="https://vanguardgym.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-mbjj-red transition font-bold"
            >
              VanGuard Gym
            </a>
          </p>
          <p className="text-gray-400 mt-1">
            <a
              href="https://maps.google.com/?q=9414+Center+Point+Ln,+Manassas,+VA+20110"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-mbjj-red transition inline-flex items-center gap-1 justify-center"
            >
              <span>📍</span> 9414 Center Point Ln, Manassas, VA
            </a>
          </p>
          <p className="text-gray-500 text-sm mt-4">&copy; 2025 Vanguard League. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
