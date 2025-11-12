'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface Player {
  id: number;
  name: string;
  photo_url: string | null;
  bjj_belt_rank: string | null;
  weight: number | null;
  weight_class_name: string | null;
  academy: string | null;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      // Fetch all registered fighters from the roster
      const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
      const endpoint = isStatic ? '/data/players.json' : `${config.apiUrl}/api/players`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const playersData = await res.json();
        // Sort by weight
        playersData.sort((a: Player, b: Player) => {
          if (!a.weight) return 1;
          if (!b.weight) return -1;
          return a.weight - b.weight;
        });
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByWeightClass = () => {
    // Use backend's official weight class assignments
    const lightweight = players.filter(p => p.weight_class_name === 'Lightweight');
    const middleweight = players.filter(p => p.weight_class_name === 'Middleweight');
    const heavyweight = players.filter(p => p.weight_class_name === 'Heavyweight');
    return { lightweight, middleweight, heavyweight };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-mbjj-dark">
        <div className="text-2xl font-heading text-gray-600 dark:text-gray-400">LOADING...</div>
      </div>
    );
  }

  const groups = groupByWeightClass();

  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      <header className="bg-mbjj-dark text-white py-8">
        <div className="container mx-auto px-4">
          <a href="/" className="text-mbjj-red hover:text-mbjj-accent-light inline-block mb-4">
            ← Home
          </a>
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-2">
              FIGHTERS
            </h1>
            <div className="h-1 w-32 bg-mbjj-red mx-auto mb-4"></div>
            <p className="text-xl md:text-2xl font-heading text-gray-300">
              VGI TRENCH ROSTER
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

      <main className="container mx-auto px-4 py-12">
        {/* Lightweight */}
        {groups.lightweight.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-4xl font-heading font-bold text-mbjj-red">LIGHTWEIGHT</h2>
              <span className="text-xl text-gray-600 dark:text-gray-400">Under 170 lbs</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.lightweight.map((player) => (
                <a
                  key={player.id}
                  href={"/players/" + player.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-transparent hover:border-mbjj-red transition shadow-lg hover:shadow-2xl"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-20 h-20 rounded-full border-4 border-mbjj-red object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center border-4 border-mbjj-red">
                        <span className="text-3xl">👤</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                        {player.name.replace('*', '')}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {player.bjj_belt_rank || 'Unknown'} Belt
                      </div>
                      {player.academy && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {player.academy}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
                    <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                    <span className="font-bold text-mbjj-red">{player.weight} lbs</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Middleweight */}
        {groups.middleweight.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-4xl font-heading font-bold text-mbjj-blue">MIDDLEWEIGHT</h2>
              <span className="text-xl text-gray-600 dark:text-gray-400">170-200 lbs</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.middleweight.map((player) => (
                <a
                  key={player.id}
                  href={"/players/" + player.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-transparent hover:border-mbjj-blue transition shadow-lg hover:shadow-2xl"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-20 h-20 rounded-full border-4 border-mbjj-blue object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center border-4 border-mbjj-blue">
                        <span className="text-3xl">👤</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                        {player.name.replace('*', '')}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {player.bjj_belt_rank || 'Unknown'} Belt
                      </div>
                      {player.academy && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {player.academy}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
                    <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                    <span className="font-bold text-mbjj-blue">{player.weight} lbs</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Heavyweight */}
        {groups.heavyweight.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-4xl font-heading font-bold text-mbjj-red">HEAVYWEIGHT</h2>
              <span className="text-xl text-gray-600 dark:text-gray-400">Over 200 lbs</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.heavyweight.map((player) => (
                <a
                  key={player.id}
                  href={"/players/" + player.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-transparent hover:border-mbjj-red transition shadow-lg hover:shadow-2xl"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-20 h-20 rounded-full border-4 border-mbjj-red object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center border-4 border-mbjj-red">
                        <span className="text-3xl">👤</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                        {player.name.replace('*', '')}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {player.bjj_belt_rank || 'Unknown'} Belt
                      </div>
                      {player.academy && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {player.academy}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
                    <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                    <span className="font-bold text-mbjj-red">{player.weight} lbs</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Summary */}
        <div className="mt-12 p-8 bg-mbjj-dark rounded-lg text-white text-center">
          <p className="text-3xl font-heading font-bold">
            TOTAL FIGHTERS: <span className="text-mbjj-red">{players.length}</span>
          </p>
          <div className="mt-4 flex justify-center gap-8 text-lg">
            <div>
              <span className="text-gray-400">Lightweight:</span> <span className="font-bold">{groups.lightweight.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Middleweight:</span> <span className="font-bold">{groups.middleweight.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Heavyweight:</span> <span className="font-bold">{groups.heavyweight.length}</span>
            </div>
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
