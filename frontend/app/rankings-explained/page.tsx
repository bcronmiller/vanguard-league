'use client';

export default function RankingsExplainedPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      {/* Header */}
      <header className="bg-mbjj-dark text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 mb-3">
            <a href="/" className="text-mbjj-red hover:text-mbjj-accent-light">
              ← Home
            </a>
            <span className="text-gray-600">|</span>
            <a href="/season-rules" className="text-mbjj-red hover:text-mbjj-accent-light">
              Season Rules
            </a>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">
            HOW RANKINGS WORK
          </h1>
          <div className="h-0.5 w-24 bg-mbjj-red mt-2"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* League Mission */}
        <section className="bg-gradient-to-r from-mbjj-blue to-blue-700 text-white rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-3xl font-heading font-bold mb-4">
            WHY WE USE ELO RANKINGS
          </h2>
          <p className="text-lg mb-4 leading-relaxed">
            The Vanguard League exists to provide <strong>affordable, professional-level tournament experience</strong> for grapplers who aspire to compete at the highest levels or simply want the thrill and excitement of regular competition.
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            Our ranking system reflects our core philosophy: <strong>consistency and longevity matter more than any single match</strong>. While each bout is important, what truly counts is that you stay safe, stay healthy, and return to compete at the next event and the one after that.
          </p>
          <p className="text-lg leading-relaxed">
            <strong>Your health is your career.</strong> Tap early, tap often, and live to train another day. Our ELO system rewards those who show up regularly, take smart risks, and build their skills over an entire season. This is a marathon, not a sprint.
          </p>
        </section>

        {/* ELO System Overview */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8 shadow-lg">
          <h2 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
            HOW THE RATING SYSTEM WORKS
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Vanguard League uses an <strong>ELO-based rating system</strong> similar to chess, adapted for submission-only grappling.
            Your rating changes based on match results, with bigger gains for beating higher-rated opponents.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            The system is designed to reward <strong>quality over quantity</strong> and emphasizes improvement over time rather than win-loss record alone.
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
                <span>Blue Belt Fighter: 1400 → 1567 ELO (2-1 record)</span>
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
              <div className="text-3xl font-heading font-bold text-mbjj-blue">1400 ELO</div>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4">
              <div className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Purple Belt</div>
              <div className="text-3xl font-heading font-bold text-purple-600 dark:text-purple-400">1600 ELO</div>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4">
              <div className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Brown Belt</div>
              <div className="text-3xl font-heading font-bold text-amber-700 dark:text-amber-500">1800 ELO</div>
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
            💪 REWARDS CONSISTENCY & SAFETY
          </h2>
          <p className="text-lg mb-4">
            The ELO system is designed to reward regular participation and smart competition over a full season:
          </p>
          <ul className="space-y-3 text-lg">
            <li className="flex items-start">
              <span className="text-2xl mr-3">🔄</span>
              <span><strong>More events = more opportunities to improve</strong> — Show up regularly and climb the ladder</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">📈</span>
              <span><strong>Steady improvement matters more than one big win</strong> — Consistent performance compounds over time</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">🛡️</span>
              <span><strong>Protect your health to stay in the game</strong> — One injury can derail a season; smart tapping keeps you competing</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">🎯</span>
              <span><strong>Challenge yourself against higher-rated opponents</strong> — Bigger risks = bigger rewards (when you win)</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">🏆</span>
              <span><strong>Season rankings reward sustained excellence</strong> — It's not about one match; it's about the whole journey</span>
            </li>
          </ul>
          <div className="mt-6 bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-lg">
              <strong>Remember:</strong> No single match defines your season. Stay safe, come back to the next event, and keep building. The grapplers who win seasons are the ones who stay healthy and show up consistently.
            </p>
          </div>
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
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Each fighter has separate ELO ratings for each weight class they compete in, allowing you to track your performance across divisions.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-mbjj-blue">
            <p className="text-gray-700 dark:text-gray-300">
              💡 <strong>Multi-Division Fighters:</strong> If you compete in multiple weight classes, you'll have separate records and ELO ratings for each division. This allows you to challenge yourself at different weights while maintaining accurate rankings in each class.
            </p>
          </div>
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
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-xl font-heading font-bold mb-1">LIGHTNING STRIKE</div>
                <p className="text-white/90">Win 5 matches in under 30 seconds. You strike before they can react!</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">🧱</div>
                <div className="text-xl font-heading font-bold mb-1">UNBEATABLE</div>
                <p className="text-white/90">Hard to kill - 5 or more draws. You keep coming back!</p>
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
                <div className="text-2xl mb-1">🔺</div>
                <div className="text-lg font-heading font-bold">TRIANGLE</div>
                <p className="text-sm text-white/80">Triangle choke variations</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="text-2xl mb-1">🥷</div>
                <div className="text-lg font-heading font-bold">DARCE KNIGHT</div>
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

          {/* Advanced Badges */}
          <div className="mb-8">
            <h3 className="text-2xl font-heading font-bold mb-4 border-b border-white/30 pb-2">
              ADVANCED BADGES
            </h3>
            <p className="text-white/90 mb-4">
              Master-level achievements for specialized dominance:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">💀</div>
                <div className="text-xl font-heading font-bold mb-1">BONE COLLECTOR</div>
                <p className="text-white/90">Earn 5+ armbar submissions. You break arms for a living!</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">🐍</div>
                <div className="text-xl font-heading font-bold mb-1">THE STRANGLER</div>
                <p className="text-white/90">Earn 5+ choke submissions (RNC, Darce, Guillotine, Triangle, etc.)</p>
              </div>
            </div>
          </div>

          {/* Special Badges */}
          <div className="mb-8">
            <h3 className="text-2xl font-heading font-bold mb-4 border-b border-white/30 pb-2">
              SPECIAL BADGES
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">⚖️</div>
                <div className="text-xl font-heading font-bold mb-1">MULTI-DIVISION</div>
                <p className="text-white/90">Compete in multiple weight classes. Shows your versatility!</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">🤯</div>
                <div className="text-xl font-heading font-bold mb-1">THE SPOILER</div>
                <p className="text-white/90">Defeat an opponent two or more belt ranks above you. Giant killer!</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">❤️‍🔥</div>
                <div className="text-xl font-heading font-bold mb-1">WARRIOR SPIRIT</div>
                <p className="text-white/90">Most matches in a single event (minimum 3, no ties). You came to fight!</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-xl font-heading font-bold mb-1">PRIZE POOL</div>
                <p className="text-white/90">Eligible for season prize pool (5+ events attended, 12+ total matches). You're in it for the long haul!</p>
              </div>
            </div>
            <div className="mt-4 bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-white/90">
                📖 <strong>Want to learn more about season prize eligibility?</strong> Visit the <a href="/season-rules" className="text-yellow-300 hover:text-yellow-100 font-bold underline">Season Rules page</a> for full details on requirements and policies.
              </p>
            </div>
          </div>

          {/* Manual Badges (Admin Awarded) */}
          <div>
            <h3 className="text-2xl font-heading font-bold mb-4 border-b border-white/30 pb-2">
              MANUALLY AWARDED BADGES
            </h3>
            <p className="text-white/90 mb-4">
              These badges are awarded by the event organizers for exceptional performances:
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="text-2xl mb-1">🍑</div>
                <div className="text-lg font-heading font-bold">BUTTSCOOTER</div>
                <p className="text-sm text-white/80">Guard puller specialist</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="text-2xl mb-1">🍄</div>
                <div className="text-lg font-heading font-bold">TRIPPY</div>
                <p className="text-sm text-white/80">Footsweep Assassin</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-lg font-heading font-bold">FIGHT OF THE NIGHT</div>
                <p className="text-sm text-white/80">Best fight of the event</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-white/90">
              💡 <strong>Pro Tip:</strong> Collect all submission badges by diversifying your techniques. Show you're a complete grappler!
            </p>
          </div>
        </section>

        {/* Related Content */}
        <section className="bg-mbjj-dark text-white rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-heading font-bold mb-4 text-center">
            READY TO COMPETE?
          </h3>
          <div className="text-center">
            <a
              href="/season-rules"
              className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-heading font-bold px-8 py-3 rounded-lg transition shadow-md"
            >
              VIEW SEASON PRIZE POOL RULES →
            </a>
            <p className="text-gray-400 text-sm mt-3">
              Learn about eligibility requirements and how to compete for season prizes
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
