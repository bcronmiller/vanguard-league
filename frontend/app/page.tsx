'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

export default function Home() {
  const apiUrl = config.apiUrl;
  const readOnly = config.readOnly;
  const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';

  const [stats, setStats] = useState({ players: 0, matches: 0 });
  const [ladderData, setLadderData] = useState<any>({
    overall: [],
    lightweight: [],
    middleweight: [],
    heavyweight: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Fetch match count
    try {
    const eventsEndpoint = isStatic ? '/data/events.json' : `${apiUrl}/api/events`;
    const eventsRes = await fetch(eventsEndpoint, {
      cache: 'no-store'
    });
    if (eventsRes.ok) {
      const events = await eventsRes.json();
      let totalMatches = 0;

      // Sum up matches from all events
      for (const event of events) {
        try {
          const matchEndpoint = isStatic
            ? `/data/matches-event-${event.id}.json`
            : `${apiUrl}/api/events/${event.id}/matches`;
          const matchRes = await fetch(matchEndpoint, {
            cache: 'no-store'
          });
          if (matchRes.ok) {
            const data = await matchRes.json();
            // Count actual matches from the array
            if (Array.isArray(data)) {
              totalMatches += data.length;
            }
          }
        } catch (e) {
          // Skip this event if matches fail to load
        }
      }

      setStats(prev => ({ ...prev, matches: totalMatches }));
    }
  } catch (e) {
    // Continue with default stats if API fails
  }

  // Fetch overall ladder standings
  try {
    const ladderEndpoint = isStatic ? '/data/ladder-overall.json' : `${apiUrl}/api/ladder/overall`;
    const ladderRes = await fetch(ladderEndpoint, {
      cache: 'no-store'
    });
    if (ladderRes.ok) {
      const allLadder = await ladderRes.json();

      const lightweight: any[] = [];
      const middleweight: any[] = [];
      const heavyweight: any[] = [];

      // Separate by weight class based on player weight
      for (const standing of allLadder) {
        const weight = standing.player.weight;
        if (weight && weight <= 170) {
          lightweight.push(standing);
        } else if (weight && weight > 170 && weight <= 200) {
          middleweight.push(standing);
        } else if (weight && weight > 200) {
          heavyweight.push(standing);
        }
      }

      setLadderData({
        overall: allLadder,
        lightweight,
        middleweight,
        heavyweight
      });

      // Count active competitors (only fighters who have competed)
      setStats(prev => ({ ...prev, players: allLadder.length }));
    }
  } catch (e) {
    // Ladder optional
  }

    setLoading(false);
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
              at VanGuard Gym
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
              <div className="text-xl font-heading uppercase tracking-wide">Active Fighters</div>
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
                Automatic ladder rankings by weight class.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border-t-4 border-mbjj-red">
              <div className="text-4xl text-mbjj-red mb-4 text-center">💰</div>
              <h3 className="text-2xl font-heading font-bold mb-3 text-center">SEASON PRIZES</h3>
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Top-ranked fighters earn from the season prize pool.
              </p>
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

        {/* Current Champions */}
        <section>
          <h2 className="text-3xl font-heading font-bold text-center mb-8 text-gray-900 dark:text-white">
            CURRENT #1 RANKED FIGHTERS
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Lightweight */}
            <a href="/ladder/lightweight" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-t-4 border-mbjj-red overflow-hidden hover:shadow-2xl transition group">
              <div className="bg-mbjj-red text-white p-4">
                <h3 className="font-heading font-bold text-xl text-center">LIGHTWEIGHT</h3>
                <p className="text-center text-xs">170 lbs and below</p>
              </div>
              <div className="p-6">
                {ladderData.lightweight.length > 0 ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥇</div>
                    <div className="font-heading font-bold text-xl text-gray-900 dark:text-white group-hover:text-mbjj-red">
                      {ladderData.lightweight[0].player.name.replace('*', '')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {ladderData.lightweight[0].wins}-{ladderData.lightweight[0].losses}-{ladderData.lightweight[0].draws} • ELO: {Math.round(ladderData.lightweight[0].player.elo_rating || 0)}
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
                <p className="text-center text-xs">171-200 lbs</p>
              </div>
              <div className="p-6">
                {ladderData.middleweight.length > 0 ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥇</div>
                    <div className="font-heading font-bold text-xl text-gray-900 dark:text-white group-hover:text-mbjj-blue">
                      {ladderData.middleweight[0].player.name.replace('*', '')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {ladderData.middleweight[0].wins}-{ladderData.middleweight[0].losses}-{ladderData.middleweight[0].draws} • ELO: {Math.round(ladderData.middleweight[0].player.elo_rating || 0)}
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
                      {ladderData.heavyweight[0].wins}-{ladderData.heavyweight[0].losses}-{ladderData.heavyweight[0].draws} • ELO: {Math.round(ladderData.heavyweight[0].player.elo_rating || 0)}
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

      </main>

      <footer className="bg-mbjj-dark text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="font-heading text-lg mb-2">VANGUARD LEAGUE</p>
          <p className="text-gray-400">Hosted at VanGuard Gym</p>
          <p className="text-gray-500 text-sm mt-4">&copy; 2025 Vanguard League. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
