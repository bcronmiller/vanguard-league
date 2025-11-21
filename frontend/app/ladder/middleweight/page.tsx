'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';
import { Fighter } from '@/lib/types';
import LadderTable from '@/components/LadderTable';
import Link from 'next/link';

export default function MiddleweightPage() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLadder();
  }, []);

  const loadLadder = async () => {
    try {
      const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
      const endpoint = isStatic
        ? '/data/ladder-middleweight.json'
        : `${config.apiUrl}/api/ladder/weight-class/Middleweight`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();

        // Both static and API modes return a LadderResponse object with standings
        const standings = data.standings || [];

        // Convert LadderEntry format to Fighter format
        const fighters = standings.map((entry: any) => ({
          player: {
            id: entry.player_id,
            name: entry.player_name,
            bjj_belt_rank: entry.belt_rank,
            weight: null, // Weight not included in LadderEntry
            weight_class_name: 'Middleweight',
            elo_rating: entry.elo_rating,
            initial_elo_rating: entry.initial_elo_rating,
            photo_url: entry.photo_url,
            academy: null // Academy not included in LadderEntry
          },
          wins: entry.wins,
          losses: entry.losses,
          draws: entry.draws
        }));

        setFighters(fighters);
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
          <Link href="/" className="text-white hover:text-gray-200 inline-block mb-4">
            ← Home
          </Link>
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
                <li>• Starting ratings based on belt rank (White=1200, Blue=1400, Purple=1600, Brown=1800, Black=2000)</li>
              </ul>
              <Link
                href="/rankings-explained"
                className="text-mbjj-blue hover:text-mbjj-red font-heading font-bold text-sm transition"
              >
                Learn More About ELO Rankings →
              </Link>
            </div>
          </div>
        </div>

        <LadderTable fighters={fighters} colorTheme="blue" />

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
              <span>📍</span> 9414 Center Point Ln, Manassas, VA
            </a>
          </p>
          <p className="text-gray-500 text-sm mt-4">&copy; 2025 Vanguard League. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
