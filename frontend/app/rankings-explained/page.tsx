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
            🏆 RANKED BY IMPROVEMENT, NOT WIN-LOSS RECORD
          </h2>
          <p className="text-lg mb-4">
            Rankings are <strong>NOT based on your win-loss record</strong>. Instead, they show your <strong>ELO change from your initial rating</strong> at the beginning of the season.
          </p>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-4">
            <h3 className="text-xl font-heading font-bold mb-3">Example:</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>Blue Belt Fighter: 1333 → 1500 ELO (2-1 record)</span>
                <span className="font-bold">Rank #1 (+167)</span>
              </li>
              <li className="flex justify-between">
                <span>Black Belt Fighter: 2000 → 2000 ELO (3-0 record)</span>
                <span className="font-bold">Rank #2 (0)</span>
              </li>
            </ul>
          </div>
          <p className="text-lg mb-3">
            The blue belt ranks higher despite having one loss because they improved their ELO more (+167 vs 0). This rewards <strong>quality wins over quantity</strong> and makes improvement the primary measure of success.
          </p>
          <p className="text-lg">
            A blue belt climbing the rankings by beating higher-rated opponents is just as impressive as a black belt doing the same.
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
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Draw with a higher-rated opponent:</strong> Small gain (you exceeded expectations)</li>
                <li><strong>Draw with an equal-rated opponent:</strong> No change (expected outcome)</li>
                <li><strong>Draw with a lower-rated opponent:</strong> Small loss (you underperformed)</li>
              </ul>
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

        {/* Badge System */}
        <section className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-3xl font-heading font-bold mb-6">
            🏅 ACHIEVEMENT BADGE SYSTEM
          </h2>
          <p className="text-lg mb-6">
            Fighters earn badges for accomplishments and submission variety. Badges appear on fighter profiles and showcase your unique fighting style.
          </p>

          {/* Streak Badges */}
          <div className="mb-8">
            <h3 className="text-2xl font-heading font-bold mb-4 border-b border-white/30 pb-2">
              STREAK BADGES
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">🔥</div>
                <div className="text-xl font-heading font-bold mb-1">ON FIRE</div>
                <p className="text-white/90">Win 3+ matches in a row. Shows your current winning streak!</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">💪</div>
                <div className="text-xl font-heading font-bold mb-1">COMEBACK KID</div>
                <p className="text-white/90">Win after losing 2+ matches. Proves you never give up!</p>
              </div>
            </div>
          </div>

          {/* Submission Badges */}
          <div className="mb-8">
            <h3 className="text-2xl font-heading font-bold mb-4 border-b border-white/30 pb-2">
              SUBMISSION BADGES
            </h3>
            <p className="text-white/90 mb-4">
              Earn these by successfully executing each submission type at least once:
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="text-2xl mb-1">🦶</div>
                <div className="text-lg font-heading font-bold">FOOTSIE</div>
                <p className="text-sm text-white/80">Leg locks (heel hook, ankle lock, kneebar, toe hold)</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="text-2xl mb-1">▲</div>
                <div className="text-lg font-heading font-bold">TRIANGLE</div>
                <p className="text-sm text-white/80">Triangle choke variations</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="text-2xl mb-1">🛡️</div>
                <div className="text-lg font-heading font-bold">DARCE</div>
                <p className="text-sm text-white/80">Darce choke submission</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="text-2xl mb-1">⚔️</div>
                <div className="text-lg font-heading font-bold">GUILLOTINE</div>
                <p className="text-sm text-white/80">Guillotine choke</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="text-2xl mb-1">😴</div>
                <div className="text-lg font-heading font-bold">CHOKEOUT</div>
                <p className="text-sm text-white/80">Rear naked choke</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="text-2xl mb-1">🦴</div>
                <div className="text-lg font-heading font-bold">ARMBAR</div>
                <p className="text-sm text-white/80">Armbar submission</p>
              </div>
            </div>
          </div>

          {/* Other Badges */}
          <div>
            <h3 className="text-2xl font-heading font-bold mb-4 border-b border-white/30 pb-2">
              SPECIAL BADGES
            </h3>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">⚖️</div>
              <div className="text-xl font-heading font-bold mb-1">MULTI-DIVISION</div>
              <p className="text-white/90">Compete in multiple weight classes. Shows your versatility!</p>
            </div>
          </div>

          <div className="mt-6 bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-white/90">
              💡 <strong>Pro Tip:</strong> Collect all submission badges by diversifying your techniques. Show you're a complete grappler!
            </p>
          </div>
        </section>
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
