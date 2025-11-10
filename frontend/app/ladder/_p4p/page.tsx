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
        setFighters(data);
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
    if (weight < 185) return 'Middleweight';
    return 'Heavyweight';
  };

  const getWeightClassColor = (weight: number | null) => {
    if (!weight) return 'bg-gray-500';
    if (weight < 170) return 'bg-mbjj-red';
    if (weight < 185) return 'bg-mbjj-blue';
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
              OVERALL LADDER RANKINGS
            </p>
            <p className="text-lg text-gray-200 mt-2">
              All Weight Classes Combined
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
                  {!readOnly && (
                    <th className="px-6 py-4 text-center font-heading font-bold">ELO</th>
                  )}
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
                    {!readOnly && (
                      <td className="px-6 py-4 text-center font-heading font-bold text-2xl text-mbjj-blue">
                        {Math.round(fighter.player.elo_rating)}
                      </td>
                    )}
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
          <p className="text-gray-400">Hosted at VanGuard Gym</p>
          <p className="text-gray-500 text-sm mt-4">&copy; 2025 Vanguard League. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
