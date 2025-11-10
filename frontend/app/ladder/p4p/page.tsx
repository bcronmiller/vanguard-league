'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface Fighter {
  player: {
    id: number;
    name: string;
    bjj_belt_rank: string | null;
    weight: number | null;
    elo_rating: number;
    initial_elo_rating: number | null;
    photo_url: string | null;
    academy: string | null;
  };
  wins: number;
  losses: number;
  draws: number;
}

export default function PoundForPoundPage() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const readOnly = config.readOnly;
  const apiUrl = config.apiUrl;
  const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';

  useEffect(() => {
    loadLadder();
  }, []);

  const loadLadder = async () => {
    try {
      const endpoint = isStatic ? '/data/ladder-overall.json' : `${apiUrl}/api/ladder/overall`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();

        // Sort by ELO gain (improvement from starting rating) for P4P rankings
        const sorted = data.sort((a: Fighter, b: Fighter) => {
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

  const getWeightClass = (weight: number | null) => {
    if (!weight) return 'N/A';
    if (weight < 170) return 'Lightweight';
    if (weight <= 200) return 'Middleweight';
    return 'Heavyweight';
  };

  const getWeightClassColor = (weight: number | null) => {
    if (!weight) return 'bg-gray-500';
    if (weight < 170) return 'bg-mbjj-red';
    if (weight <= 200) return 'bg-mbjj-blue';
    return 'bg-mbjj-red';
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
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-8">
        <div className="container mx-auto px-4">
          <a href="/" className="text-white hover:text-gray-200 inline-block mb-4">
            ← Home
          </a>
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-heading font-bold text-white mb-2">
              POUND-FOR-POUND
            </h2>
            <div className="h-1 w-32 bg-white mx-auto mb-4"></div>
            <p className="text-xl md:text-2xl font-heading text-gray-100">
              PERFORMANCE VS. EXPECTATIONS
            </p>
            <p className="text-lg text-gray-200 mt-2">
              Ranked by ELO Gain from Belt-Based Starting Rating
            </p>
          </div>
        </div>
      </div>

      {/* Explanation Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-6">
          <h3 className="text-2xl font-heading font-bold text-yellow-800 dark:text-yellow-200 mb-3">
            📊 HOW P4P RANKINGS WORK
          </h3>
          <div className="space-y-3 text-gray-800 dark:text-gray-200">
            <p className="text-lg">
              <strong>Pound-for-Pound rankings measure performance vs. expectations, not absolute strength.</strong> Fighters are ranked by how much they've exceeded or fallen short of expectations based on their starting belt rank.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded p-4 border-l-4 border-yellow-500 mb-3">
              <p className="font-bold mb-2">Why can a Blue Belt rank above a Black Belt?</p>
              <p className="text-sm leading-relaxed">
                A Blue Belt who gains <strong className="text-green-600 dark:text-green-400">+54 ELO points</strong> has vastly outperformed expectations (started at 1333 → now 1387).
                A Black Belt who gains <strong className="text-green-600 dark:text-green-400">+4.5 points</strong> is performing at expectations (started at 2000 → now 2004.5).
                The Blue Belt's performance is more impressive <em>relative to their skill level</em>, even if they lost head-to-head.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-4 border-l-4 border-yellow-500">
              <p className="font-bold mb-2">How Belt Rank Affects Point Changes</p>
              <p className="text-sm leading-relaxed">
                When a <strong>Black Belt beats a Blue Belt</strong>, we expect this outcome, so the ELO change is small (maybe +2 points for the Black Belt, -2 for the Blue Belt).
                But when a <strong>Blue Belt beats a Black Belt</strong>, it's a major upset — the Blue Belt gains significantly (+30-40 points) while the Black Belt loses the same amount.
                <strong className="block mt-2">These big swings from upsets are what determine P4P rankings.</strong> Fighters who consistently defeat higher-ranked opponents rise quickly.
              </p>
            </div>
            <p className="text-sm mt-3">
              <strong>Starting ELO by Belt:</strong> Black (2000) • Brown (1600) • Purple (1467) • Blue (1333) • White (1200)
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-mbjj-dark text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-heading font-bold">RANK</th>
                  <th className="px-6 py-4 text-left font-heading font-bold">FIGHTER</th>
                  <th className="px-6 py-4 text-left font-heading font-bold">WEIGHT CLASS</th>
                  <th className="px-6 py-4 text-center font-heading font-bold">RECORD</th>
                  <th className="px-6 py-4 text-center font-heading font-bold">ELO GAIN</th>
                  <th className="px-6 py-4 text-center font-heading font-bold">CURRENT ELO</th>
                  <th className="px-6 py-4 text-left font-heading font-bold">BELT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {fighters.map((fighter, idx) => (
                  <tr key={fighter.player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4">
                      <span className="font-heading font-bold text-2xl text-mbjj-red">#{idx + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <a href={`/players/${fighter.player.id}`} className="flex items-center gap-3 hover:text-mbjj-red transition">
                        {fighter.player.photo_url && (
                          <img
                            src={fighter.player.photo_url}
                            alt={fighter.player.name}
                            className="w-12 h-12 rounded-full border-2 border-mbjj-red object-cover"
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
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 ${getWeightClassColor(fighter.player.weight)} text-white text-xs font-bold rounded-full`}>
                        {getWeightClass(fighter.player.weight).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-heading font-bold text-lg">
                      {fighter.wins}-{fighter.losses}-{fighter.draws}
                    </td>
                    <td className="px-6 py-4 text-center font-heading">
                      {fighter.player.initial_elo_rating ? (
                        <div className="flex flex-col items-center">
                          <span className={`text-3xl font-bold ${
                            (fighter.player.elo_rating - fighter.player.initial_elo_rating) >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {(fighter.player.elo_rating - fighter.player.initial_elo_rating) >= 0 ? '+' : ''}
                            {Math.round(fighter.player.elo_rating - fighter.player.initial_elo_rating)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ({Math.round(fighter.player.initial_elo_rating)} → {Math.round(fighter.player.elo_rating)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-heading font-bold text-2xl text-mbjj-blue">
                      {Math.round(fighter.player.elo_rating)}
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
              No fighters with completed matches yet
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className={`mt-8 grid ${readOnly ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border-t-4 border-mbjj-red">
            <div className="text-4xl font-heading font-bold text-mbjj-red mb-2">{fighters.length}</div>
            <div className="text-gray-600 dark:text-gray-400 font-heading">TOTAL FIGHTERS</div>
          </div>
          {!readOnly && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border-t-4 border-mbjj-blue">
              <div className="text-4xl font-heading font-bold text-mbjj-blue mb-2">
                {fighters.length > 0 ? Math.round(fighters[0].player.elo_rating) : 0}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-heading">TOP ELO RATING</div>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border-t-4 border-mbjj-red">
            <div className="text-4xl font-heading font-bold text-mbjj-red mb-2">
              {fighters.reduce((sum, f) => sum + f.wins + f.losses + f.draws, 0)}
            </div>
            <div className="text-gray-600 dark:text-gray-400 font-heading">TOTAL MATCHES</div>
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
