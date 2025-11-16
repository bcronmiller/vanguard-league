'use client';
import { config } from '@/lib/config';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Fighter {
  id: number;
  name: string;
  belt_rank: string | null;
  elo_rating: number;
  elo_change: number;
  photo_url: string | null;
  match_count: number;
}

interface Academy {
  academy_name: string;
  fighter_count: number;
  climber_count: number;
  avg_elo_change: number;
  total_elo_change: number;
  total_matches: number;
  fighters: Fighter[];
  logo_url: string | null;
  website: string | null;
}

export default function AcademiesPage() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAcademies();
  }, []);

  const loadAcademies = async () => {
    try {
      const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
      const endpoint = isStatic
        ? '/data/academies.json'
        : `${config.apiUrl}/api/academies`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setAcademies(data.academies || []);
      }
    } catch (error) {
      console.error('Failed to load academies:', error);
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
      <div className="bg-gradient-to-r from-mbjj-dark to-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-white hover:text-gray-200 inline-block mb-4">
            ← Home
          </Link>
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-heading font-bold text-white mb-2">
              ALL ACADEMIES
            </h2>
            <div className="h-1 w-32 bg-mbjj-red mx-auto mb-4"></div>
            <p className="text-xl md:text-2xl font-heading text-gray-100">
              VANGUARD LEAGUE TEAMS
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        {/* How Rankings Work Info Box */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-lg p-6 mb-8 border-l-4 border-mbjj-dark">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🏆</div>
            <div>
              <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-2">
                HOW ACADEMY RANKINGS WORK
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Academy rankings are based on the <strong>average ELO increase of improving fighters only</strong>. This methodology encourages academies to bring all fighters without penalty for developing beginners.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Each fighter starts with an ELO rating based on belt rank (White=1200, Blue=1400, Purple=1600, Brown=1800, Black=2000)</li>
                <li>• Only positive ELO changes count - fighters who improve their rating</li>
                <li>• Average = (Sum of all positive ELO increases) ÷ (Number of climbers)</li>
                <li>• Negative ELO changes don't hurt your academy's ranking</li>
                <li>• This rewards bringing developing fighters who gain valuable experience</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Competed Academies - Ranked */}
        {academies.filter(a => a.total_matches > 0).length > 0 && (
          <>
            <h3 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
              ACADEMY RANKINGS
            </h3>
            <div className="space-y-6 mb-12">
              {academies
                .filter(academy => academy.total_matches > 0)
                .sort((a, b) => b.avg_elo_change - a.avg_elo_change)
                .map((academy, idx) => (
            <div
              key={academy.academy_name}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-mbjj-dark"
            >
              {/* Academy Header */}
              <div className="bg-gradient-to-r from-mbjj-dark to-gray-800 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-heading font-bold text-mbjj-red">
                      #{idx + 1}
                    </div>
                    {academy.logo_url && (
                      <img
                        src={academy.logo_url}
                        alt={academy.academy_name}
                        className="h-16 w-auto object-contain bg-white rounded p-2"
                      />
                    )}
                    <div>
                      <h3 className="text-2xl md:text-3xl font-heading font-bold">
                        {academy.academy_name}
                      </h3>
                      {academy.website && (
                        <a
                          href={academy.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-300 hover:text-white transition"
                        >
                          {academy.website}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-heading font-bold ${
                      academy.avg_elo_change >= 0
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}>
                      {academy.avg_elo_change > 0 ? '+' : ''}{academy.avg_elo_change.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      AVG ELO INCREASE
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {academy.climber_count > 0 ? `${academy.climber_count} climbers` : 'No climbers yet'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Academy Stats */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-heading font-bold text-mbjj-blue">
                      {academy.fighter_count}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-heading">
                      FIGHTERS
                    </div>
                  </div>
                  <div>
                    <div className={`text-3xl font-heading font-bold ${
                      academy.climber_count > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400'
                    }`}>
                      {academy.climber_count}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-heading">
                      CLIMBERS
                    </div>
                  </div>
                  <div>
                    <div className={`text-3xl font-heading font-bold ${
                      academy.avg_elo_change > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400'
                    }`}>
                      {academy.avg_elo_change > 0 ? '+' : ''}{academy.avg_elo_change.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-heading">
                      AVG ELO INCREASE
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-heading font-bold text-mbjj-blue">
                      {academy.total_matches || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-heading">
                      TOTAL MATCHES
                    </div>
                  </div>
                </div>
              </div>

              {/* Fighters List */}
              <div className="p-6">
                <h4 className="font-heading font-bold text-lg mb-4 text-gray-900 dark:text-white">
                  ROSTER
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {academy.fighters.map((fighter) => (
                    <Link
                      key={fighter.id}
                      href={`/players/${fighter.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      {fighter.photo_url && (
                        <img
                          src={fighter.photo_url}
                          alt={fighter.name}
                          className="w-12 h-12 rounded-full border-2 border-mbjj-blue object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-heading font-bold text-gray-900 dark:text-white">
                          {fighter.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {fighter.belt_rank || 'N/A'} Belt
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-heading font-bold ${
                          fighter.elo_change >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {fighter.elo_change >= 0 ? '+' : ''}{fighter.elo_change.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ({Math.round(fighter.elo_rating)} ELO)
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
                ))}
            </div>
          </>
        )}

        {/* Non-Competed Academies */}
        {academies.filter(a => a.total_matches === 0).length > 0 && (
          <>
            <h3 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
              UPCOMING ACADEMIES
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              These academies have registered fighters but haven't competed yet. Rankings will appear after their first matches.
            </p>
            <div className="space-y-6">
              {academies
                .filter(academy => academy.total_matches === 0)
                .map((academy) => (
                  <div
                    key={academy.academy_name}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 border-gray-400"
                  >
                    {/* Academy Header */}
                    <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {academy.logo_url && (
                            <img
                              src={academy.logo_url}
                              alt={academy.academy_name}
                              className="h-16 w-auto object-contain bg-white rounded p-2"
                            />
                          )}
                          <div>
                            <h3 className="text-2xl md:text-3xl font-heading font-bold">
                              {academy.academy_name}
                            </h3>
                            {academy.website && (
                              <a
                                href={academy.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-300 hover:text-white transition"
                              >
                                {academy.website}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300 bg-gray-700 px-4 py-2 rounded">
                            NOT YET COMPETED
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Academy Stats */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-3xl font-heading font-bold text-mbjj-blue">
                            {academy.fighter_count}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-heading">
                            REGISTERED FIGHTERS
                          </div>
                        </div>
                        <div>
                          <div className="text-3xl font-heading font-bold text-gray-400">
                            0
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-heading">
                            MATCHES
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fighters List */}
                    <div className="p-6">
                      <h4 className="font-heading font-bold text-lg mb-4 text-gray-900 dark:text-white">
                        ROSTER
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {academy.fighters.map((fighter) => (
                          <Link
                            key={fighter.id}
                            href={`/players/${fighter.id}`}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            {fighter.photo_url && (
                              <img
                                src={fighter.photo_url}
                                alt={fighter.name}
                                className="w-12 h-12 rounded-full border-2 border-mbjj-blue object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-heading font-bold text-gray-900 dark:text-white">
                                {fighter.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {fighter.belt_rank || 'N/A'} Belt
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Ready to compete
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {academies.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No academy data available yet
          </div>
        )}
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
