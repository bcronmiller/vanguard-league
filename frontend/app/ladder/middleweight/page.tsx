'use client';
import { config } from '@/lib/config';

import { useState, useEffect } from 'react';

interface Fighter {
  player: {
    id: number;
    name: string;
    bjj_belt_rank: string | null;
    weight: number | null;
    weight_class_name: string | null;
    elo_rating: number;
    initial_elo_rating?: number;
    photo_url: string | null;
    academy: string | null;
  };
  wins: number;
  losses: number;
  draws: number;
}

export default function MiddleweightPage() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLadder();
  }, []);

  const loadLadder = async () => {
    try {
      const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
      const endpoint = isStatic ? '/data/ladder-overall.json' : `${config.apiUrl}/api/ladder/overall`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        // Filter for middleweight only (by assigned weight class)
        const middleweight = data.filter((f: Fighter) => f.player.weight_class_name === 'Middleweight');

        // Sort by ELO gain (performance vs. expectations) for rankings
        const sorted = middleweight.sort((a: Fighter, b: Fighter) => {
          const aGain = a.player.initial_elo_rating
            ? a.player.elo_rating - a.player.initial_elo_rating
            : 0;
          const bGain = b.player.initial_elo_rating
            ? b.player.elo_rating - b.player.initial_elo_rating
            : 0;
          return bGain - aGain; // Descending order (highest gain first)
        });

        setFighters(sorted);
      }
    } catch (error) {
      console.error('Failed to load ladder:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-mbjj-dark">
        <div className="text-2xl font-heading text-gray-600 dark:text-gray-400">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      {/* VanGuard Gym Header */}
      <header className="bg-mbjj-dark text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-3">
            <img
              src="/vgg-logo.png"
              alt="VanGuard Gym"
              className="h-16 md:h-20 w-auto"
            />
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-1">
              VANGUARD LEAGUE
            </h1>
            <div className="h-0.5 w-24 bg-mbjj-red mx-auto mb-2"></div>
            <p className="text-sm md:text-base font-heading text-gray-300">
              VGI TRENCH — SUBMISSION-ONLY LADDER
            </p>
            <p className="text-xs text-gray-400 mt-1">
              at VanGuard Gym
            </p>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="bg-gradient-to-r from-mbjj-blue to-blue-700 text-white py-8">
        <div className="container mx-auto px-4">
          <a href="/" className="text-white hover:text-gray-200 inline-block mb-4">
            ← Home
          </a>
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-heading font-bold text-white mb-2">
              MIDDLEWEIGHT
            </h2>
            <div className="h-1 w-32 bg-white mx-auto mb-4"></div>
            <p className="text-xl md:text-2xl font-heading text-gray-100">
              LADDER RANKINGS
            </p>
            <p className="text-lg text-gray-200 mt-2">
              170-200 lbs
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        {/* How Rankings Work Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 mb-8 border-l-4 border-mbjj-blue">
          <div className="flex items-start gap-3">
            <div className="text-3xl">📊</div>
            <div>
              <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-2">
                HOW RANKINGS WORK
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Rankings are based on <strong>performance vs. expectations</strong>, accounting for belt rank. When a Black Belt beats a lower belt, it's expected, so there's minimal point change. But when a lower belt defeats a higher belt, you get big ELO swings — and <strong>those upsets determine the rankings</strong>.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                <li>• <strong>Big gains</strong> for beating higher-ranked opponents (upsets)</li>
                <li>• <strong>Small gains</strong> for expected wins against equal or lower belts</li>
                <li>• Starting ratings based on belt rank (White=1200, Blue=1333, Purple=1467, Brown=1600, Black=2000)</li>
              </ul>
              <a
                href="/rankings-explained"
                className="text-mbjj-blue hover:text-mbjj-red font-heading font-bold text-sm transition"
              >
                Learn More About ELO Rankings →
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-blue">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-mbjj-blue text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-heading font-bold">RANK</th>
                  <th className="px-6 py-4 text-left font-heading font-bold">FIGHTER</th>
                  <th className="px-6 py-4 text-center font-heading font-bold">WEIGHT</th>
                  <th className="px-6 py-4 text-center font-heading font-bold">RECORD</th>
                  <th className="px-6 py-4 text-center font-heading font-bold" title="Current ELO rating and change from starting rating">ELO RATING</th>
                  <th className="px-6 py-4 text-left font-heading font-bold">BELT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {fighters.map((fighter, idx) => (
                  <tr key={fighter.player.id} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4">
                      <span className="font-heading font-bold text-2xl text-mbjj-blue">#{idx + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <a href={`/players/${fighter.player.id}`} className="flex items-center gap-3 hover:text-mbjj-blue transition">
                        {fighter.player.photo_url && (
                          <img
                            src={fighter.player.photo_url}
                            alt={fighter.player.name}
                            className="w-12 h-12 rounded-full border-2 border-mbjj-blue object-cover"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                            {fighter.player.name.replace('*', '')}
                          </span>
                          {fighter.player.academy && (
                            <span className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                              {fighter.player.academy}
                            </span>
                          )}
                        </div>
                      </a>
                    </td>
                    <td className="px-6 py-4 text-center font-heading text-gray-600 dark:text-gray-400">
                      {fighter.player.weight} lbs
                    </td>
                    <td className="px-6 py-4 text-center font-heading font-bold text-lg">
                      {fighter.wins}-{fighter.losses}-{fighter.draws}
                    </td>
                    <td className="px-6 py-4 text-center font-heading">
                      <div className="font-bold text-2xl text-mbjj-blue">
                        {Math.round(fighter.player.elo_rating)}
                      </div>
                      {fighter.player.initial_elo_rating && (
                        <div className={`text-sm mt-1 ${
                          (fighter.player.elo_rating - fighter.player.initial_elo_rating) >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          ({(fighter.player.elo_rating - fighter.player.initial_elo_rating) >= 0 ? '+' : ''}
                          {Math.round(fighter.player.elo_rating - fighter.player.initial_elo_rating)})
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {fighter.player.bjj_belt_rank || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fighters.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No middleweight fighters with completed matches yet
            </div>
          )}
        </div>

        {/* Weight Class Stats */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border-t-4 border-mbjj-blue">
            <div className="text-4xl font-heading font-bold text-mbjj-blue mb-2">{fighters.length}</div>
            <div className="text-gray-600 dark:text-gray-400 font-heading">TOTAL FIGHTERS</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border-t-4 border-mbjj-red">
            <div className="text-4xl font-heading font-bold text-mbjj-red mb-2">
              {fighters.length > 0 ? Math.round(fighters[0].player.elo_rating) : 0}
            </div>
            <div className="text-gray-600 dark:text-gray-400 font-heading">TOP ELO RATING</div>
          </div>
        </div>
      </main>

      <footer className="bg-mbjj-dark text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="font-heading text-lg mb-2">VANGUARD LEAGUE</p>
          <p className="text-gray-400">
            <a
              href="https://maps.google.com/?q=9414+Center+Point+Ln,+Manassas,+VA+20110"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-mbjj-red transition inline-flex items-center gap-1"
            >
              <span>📍</span> Hosted at VanGuard Gym
            </a>
          </p>
          <p className="text-gray-500 text-sm mt-4">&copy; 2025 Vanguard League. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
