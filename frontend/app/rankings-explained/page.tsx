'use client';

export default function RankingsExplainedPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      {/* Header */}
      <header className="bg-mbjj-dark text-white py-6">
        <div className="container mx-auto px-4">
          <a href="/" className="text-mbjj-red hover:text-mbjj-accent-light inline-block mb-3">
            ← Home
          </a>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">
            HOW RANKINGS WORK
          </h1>
          <div className="h-0.5 w-24 bg-mbjj-red mt-2"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* ELO System Overview */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
            RATING SYSTEM
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Vanguard League uses an <strong>ELO-based rating system</strong> similar to chess, adapted for submission-only grappling.
            Your rating changes based on match results, with bigger gains for beating higher-rated opponents.
          </p>
        </section>

        {/* Ranking by Improvement */}
        <section className="bg-gradient-to-r from-mbjj-red to-red-700 text-white rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-3xl font-heading font-bold mb-6">
            🏆 RANKED BY IMPROVEMENT
          </h2>
          <p className="text-lg mb-4">
            Rankings show your <strong>ELO gain or loss</strong> from your starting rating, not your absolute ELO.
          </p>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-4">
            <h3 className="text-xl font-heading font-bold mb-3">Example:</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>Blue Belt Fighter: 1333 → 1500 ELO</span>
                <span className="font-bold">Rank #1 (+167)</span>
              </li>
              <li className="flex justify-between">
                <span>Black Belt Fighter: 2000 → 2000 ELO</span>
                <span className="font-bold">Rank #2 (0)</span>
              </li>
            </ul>
          </div>
          <p className="text-lg">
            This rewards <strong>improvement and activity</strong> over starting skill level. A blue belt climbing
            the rankings is just as impressive as a black belt doing the same.
          </p>
        </section>

        {/* Belt-Based Starting ELO */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
            STARTING RATINGS
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            All fighters start with an ELO based on their belt rank:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-heading font-bold text-gray-900 dark:text-white">White Belt</div>
              <div className="text-3xl font-heading font-bold text-mbjj-red">1200 ELO</div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4">
              <div className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Blue Belt</div>
              <div className="text-3xl font-heading font-bold text-mbjj-blue">1333 ELO</div>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4">
              <div className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Purple Belt</div>
              <div className="text-3xl font-heading font-bold text-purple-600 dark:text-purple-400">1467 ELO</div>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4">
              <div className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Brown Belt</div>
              <div className="text-3xl font-heading font-bold text-amber-700 dark:text-amber-500">1600 ELO</div>
            </div>
            <div className="bg-gray-900 dark:bg-gray-600 rounded-lg p-4 md:col-span-2">
              <div className="text-2xl font-heading font-bold text-white">Black Belt</div>
              <div className="text-3xl font-heading font-bold text-white">2000 ELO</div>
            </div>
          </div>
        </section>

        {/* How ELO Changes */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
            HOW YOUR RATING CHANGES
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-heading font-bold mb-3 text-mbjj-red">
                ✅ When You Win:
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Beat a higher-rated opponent:</strong> Big ELO gain (20-40 points)</li>
                <li><strong>Beat an equal-rated opponent:</strong> Moderate gain (~16 points)</li>
                <li><strong>Beat a lower-rated opponent:</strong> Small gain (5-10 points)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-heading font-bold mb-3 text-mbjj-blue">
                ❌ When You Lose:
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Lose to a lower-rated opponent:</strong> Big ELO loss (20-40 points)</li>
                <li><strong>Lose to an equal-rated opponent:</strong> Moderate loss (~16 points)</li>
                <li><strong>Lose to a higher-rated opponent:</strong> Small loss (5-10 points)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-heading font-bold mb-3 text-gray-600 dark:text-gray-400">
                🤝 When You Draw:
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Both fighters' ratings change slightly based on the expected outcome. If you were favored,
                you lose a few points. If you were the underdog, you gain a few points.
              </p>
            </div>
          </div>
        </section>

        {/* Rewards Activity */}
        <section className="bg-gradient-to-r from-mbjj-blue to-blue-700 text-white rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-3xl font-heading font-bold mb-6">
            💪 REWARDS REGULAR COMPETITION
          </h2>
          <p className="text-lg mb-4">
            The more you compete, the more opportunities you have to improve your rating:
          </p>
          <ul className="space-y-3 text-lg">
            <li className="flex items-start">
              <span className="text-2xl mr-3">🔄</span>
              <span><strong>More matches = more chances to climb</strong></span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">📈</span>
              <span><strong>Consistent performance shows in steady ELO growth</strong></span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">🎯</span>
              <span><strong>Challenge higher-rated opponents for bigger gains</strong></span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">🏆</span>
              <span><strong>Season rankings reward sustained excellence</strong></span>
            </li>
          </ul>
        </section>

        {/* Weight Classes */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
            ⚖️ WEIGHT CLASS RANKINGS
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Rankings are separated into three weight classes:
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-mbjj-red text-white rounded-lg p-4 text-center">
              <div className="text-2xl font-heading font-bold">LIGHTWEIGHT</div>
              <div className="text-xl">170 lbs and below</div>
            </div>
            <div className="bg-mbjj-blue text-white rounded-lg p-4 text-center">
              <div className="text-2xl font-heading font-bold">MIDDLEWEIGHT</div>
              <div className="text-xl">171-200 lbs</div>
            </div>
            <div className="bg-mbjj-red text-white rounded-lg p-4 text-center">
              <div className="text-2xl font-heading font-bold">HEAVYWEIGHT</div>
              <div className="text-xl">Over 200 lbs</div>
            </div>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            <strong>Coming Soon:</strong> Separate ELO ratings per weight class for fighters who compete in multiple divisions.
          </p>
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
