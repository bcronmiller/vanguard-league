'use client';

import Link from 'next/link';

export default function SeasonRulesPage() {
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
              SEASON PRIZE POOL RULES
            </p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-gradient-to-r from-mbjj-blue to-blue-700 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex gap-4">
            <Link href="/" className="text-white hover:text-gray-200">
              ← Home
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/rankings-explained" className="text-white hover:text-gray-200">
              How Rankings Work
            </Link>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* League Philosophy */}
        <div className="bg-gradient-to-r from-mbjj-blue to-blue-700 text-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-4xl font-heading font-bold mb-4">
            OUR MISSION
          </h2>
          <p className="text-xl mb-4 leading-relaxed">
            The Vanguard League exists to provide <strong>affordable, professional-level tournament experience</strong> for grapplers who aspire to compete at the highest levels or simply want the thrill and excitement of regular competition.
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            We believe the true value lies in <strong>consistency and longevity</strong>, not any single match. While each bout matters, what's most important is that you stay safe, stay healthy, and come back to compete at the next event, and the next one after that.
          </p>
          <p className="text-lg leading-relaxed">
            <strong>Your health is your career.</strong> Tap early, tap often, and live to train another day. The season rewards those who show up, put in the work, and build their skills over time. This is a marathon, not a sprint.
          </p>
        </div>

        {/* Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 border-t-4 border-mbjj-red">
          <h2 className="text-4xl font-heading font-bold mb-4 text-gray-900 dark:text-white">
            SEASON STRUCTURE
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            The Vanguard League operates on a seasonal format where fighters compete across multiple events to earn prize pool payouts. Each season consists of <strong>5 events</strong> held over approximately <strong>3 months</strong> (schedule may vary due to holidays and facility availability).
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            At the end of each season, prize pool awards are distributed to top-performing fighters based on ladder rankings in each weight class. The seasonal format emphasizes <strong>regular participation and consistency</strong> over individual match outcomes.
          </p>
        </div>

        {/* Eligibility Requirements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 border-t-4 border-mbjj-blue">
          <h2 className="text-4xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
            OVERALL SEASON ELIGIBILITY
          </h2>

          <div className="mb-6">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              To participate in the season prize pool system, fighters must meet <strong>BOTH</strong> of the following baseline requirements:
            </p>
          </div>

          <div className="space-y-6">
            {/* Requirement 1 */}
            <div className="bg-gradient-to-r from-mbjj-blue/10 to-blue-100/10 dark:from-mbjj-blue/20 dark:to-blue-900/20 rounded-lg p-6 border-l-4 border-mbjj-blue">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-4xl font-heading font-bold text-mbjj-blue">1</div>
                <div>
                  <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                    Minimum Event Attendance
                  </h3>
                  <p className="text-xl text-gray-800 dark:text-gray-200 font-bold mb-2">
                    Compete in at least <span className="text-mbjj-red">3 of 5 events</span> (60%)
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Fighters must attend and compete in at least 3 events during the season to qualify for prize pool consideration. This ensures fairness to those who participate consistently throughout the season.
                  </p>
                </div>
              </div>
            </div>

            {/* Requirement 2 */}
            <div className="bg-gradient-to-r from-mbjj-red/10 to-red-100/10 dark:from-mbjj-red/20 dark:to-red-900/20 rounded-lg p-6 border-l-4 border-mbjj-red">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-4xl font-heading font-bold text-mbjj-red">2</div>
                <div>
                  <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                    Minimum Match Count
                  </h3>
                  <p className="text-xl text-gray-800 dark:text-gray-200 font-bold mb-2">
                    Complete at least <span className="text-mbjj-red">6 total matches</span>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Fighters must complete at least 6 matches across the season (wins, losses, and draws all count). This establishes a sufficient sample size to accurately reflect true skill level and prevents gaming the ranking system.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    Note: This typically averages ~2 matches per event attended.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Prize Pool Badge */}
          <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border-2 border-yellow-400">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">💰</span>
              <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                PRIZE POOL BADGE
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Fighters who meet both eligibility requirements will earn the <strong>Prize Pool 💰</strong> badge on their profile, indicating they are participating in the season prize pool system.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              Note: Earning this badge means you're eligible to compete for prizes, but actual prize eligibility per weight class has additional requirements (see below).
            </p>
          </div>
        </div>

        {/* Weight Class Prize Eligibility */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 border-t-4 border-mbjj-red">
          <h2 className="text-4xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
            WEIGHT CLASS PRIZE ELIGIBILITY
          </h2>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Fighters can compete in any weight class at any event, including bonus fights and superfights. However, to be eligible for a <strong>specific weight class prize pool</strong>, you must meet BOTH of the following requirements in that division:
          </p>

          <div className="space-y-6">
            {/* Division Requirement 1 */}
            <div className="bg-gradient-to-r from-mbjj-red/10 to-red-100/10 dark:from-mbjj-red/20 dark:to-red-900/20 rounded-lg p-6 border-l-4 border-mbjj-red">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-4xl font-heading font-bold text-mbjj-red">1</div>
                <div>
                  <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                    Minimum Matches in Division
                  </h3>
                  <p className="text-xl text-gray-800 dark:text-gray-200 font-bold mb-2">
                    At least <span className="text-mbjj-red">6 matches</span> in that specific weight class
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    This ensures meaningful participation in a division before competing for its prizes. You can't win a weight class prize with just 1-2 matches.
                  </p>
                </div>
              </div>
            </div>

            {/* Division Requirement 2 */}
            <div className="bg-gradient-to-r from-mbjj-blue/10 to-blue-100/10 dark:from-mbjj-blue/20 dark:to-blue-900/20 rounded-lg p-6 border-l-4 border-mbjj-blue">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-4xl font-heading font-bold text-mbjj-blue">2</div>
                <div>
                  <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                    Most Matches in That Division
                  </h3>
                  <p className="text-xl text-gray-800 dark:text-gray-200 font-bold mb-2">
                    More matches in that weight class than <span className="text-mbjj-blue">any other division</span>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Your "primary" division naturally emerges based on where you compete most. This prevents gaming the system by spreading matches evenly across divisions.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    <strong>Special Case:</strong> If you have an exact tie (e.g., 7 Lightweight and 7 Middleweight matches), you are eligible for prizes in all tied divisions. This rewards true multi-division warriors!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Examples */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-2xl font-heading font-bold mb-4 text-gray-900 dark:text-white">
              EXAMPLES
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Scenario 1:</strong>
                  <span className="text-gray-700 dark:text-gray-300"> Fighter has 10 Lightweight matches, 3 Middleweight matches</span>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    → Eligible for Lightweight prize only (10 is most, 10 exceeds minimum)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Scenario 2:</strong>
                  <span className="text-gray-700 dark:text-gray-300"> Fighter has 7 Lightweight, 7 Middleweight, 2 Heavyweight</span>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    → Eligible for BOTH Lightweight and Middleweight prizes (exact tie, both exceed minimum)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Scenario 3:</strong>
                  <span className="text-gray-700 dark:text-gray-300"> Fighter has 12 Lightweight, 1 Middleweight superfight</span>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    → Eligible for Lightweight prize only (bonus fights don't affect primary division)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Scenario 4:</strong>
                  <span className="text-gray-700 dark:text-gray-300"> Fighter has 5 Lightweight, 4 Middleweight, 3 Heavyweight</span>
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                    → Ineligible for all division prizes (no division reaches 6-match minimum)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <strong className="text-gray-900 dark:text-white">Scenario 5:</strong>
                  <span className="text-gray-700 dark:text-gray-300"> Fighter has 12 Lightweight, 1 Heavyweight → Wants Heavyweight prize</span>
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                    → Ineligible for Heavyweight prize (only 1 match, needs 6+)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border-l-4 border-mbjj-blue">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>💡 Go-Getter Friendly:</strong> This system encourages you to compete as much as possible! Bonus fights, superfights, and cross-division matches all count toward your overall season participation (6-match requirement), while your primary competitive division naturally emerges based on where you focus your efforts.
            </p>
          </div>
        </div>

        {/* Non-Eligible Competition */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 border-t-4 border-green-500">
          <h2 className="text-4xl font-heading font-bold mb-4 text-gray-900 dark:text-white">
            COMPETING WITHOUT PRIZE ELIGIBILITY
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Fighters who do not meet the eligibility requirements can <strong>absolutely continue competing</strong> in all events! There is tremendous value in participating regardless of prize pool status:
          </p>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-2xl text-green-500">🥋</span>
              <div>
                <strong>Skill Development:</strong> Gain valuable mat time and improve your grappling technique against diverse opponents
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl text-green-500">🎯</span>
              <div>
                <strong>Competition Experience:</strong> Build comfort and confidence in high-pressure match situations
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl text-green-500">📊</span>
              <div>
                <strong>Track Your Progress:</strong> Build your match history and ELO rating to prepare for future seasons
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl text-green-500">🤝</span>
              <div>
                <strong>Community & Exposure:</strong> Connect with the local grappling community and showcase your skills
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl text-green-500">🏆</span>
              <div>
                <strong>Achievement Badges:</strong> Earn special achievement badges for submissions, streaks, and accomplishments
              </div>
            </li>
          </ul>
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-500">
            <p className="text-gray-800 dark:text-gray-200">
              <strong>Late Joiners Welcome!</strong> New fighters can jump in at any point during the season. Even if you join late and aren't eligible for prizes this season, you'll be building your skills, establishing your baseline rating, and positioning yourself for success in the next season.
            </p>
          </div>
        </div>

        {/* Shortened Season Policy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 border-t-4 border-yellow-500">
          <h2 className="text-4xl font-heading font-bold mb-4 text-gray-900 dark:text-white">
            SHORTENED SEASON POLICY
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            If the season is cut short due to unforeseen circumstances (facility closure, holidays, etc.), prize pool awards will be distributed to the top fighters who have achieved a <strong>prorated participation percentage</strong> equivalent to the eligibility requirements.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border-l-4 border-yellow-500">
            <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-3">
              Example: Season Cut Short After 4 Events
            </h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p><strong>Original Requirements:</strong> 3 of 5 events (60%) + 6 matches</p>
              <p><strong>Prorated Requirements:</strong> 2 of 3 events (~60%) + 4 matches</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-3">
                * Prorated match count = (6 ÷ 5) × actual events held, rounded to nearest whole number
              </p>
            </div>
          </div>
        </div>

        {/* Fairness Statement */}
        <div className="bg-gradient-to-r from-mbjj-blue to-blue-700 text-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-heading font-bold mb-4">
            OUR COMMITMENT TO FAIRNESS
          </h2>
          <p className="text-lg mb-4">
            These eligibility requirements exist to ensure fairness and competitive integrity for all fighters. They reward consistent participation and prevent situations where someone could join late, compete in a handful of matches, and take prize money from fighters who have been competing all season long.
          </p>
          <p className="text-lg">
            We want the Vanguard League to be a place where dedication, skill development, and consistent effort are recognized and rewarded. Whether you're competing for prizes or just for the love of the sport, we're glad to have you on the mats!
          </p>
        </div>

        {/* FAQ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border-t-4 border-gray-500">
          <h2 className="text-4xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
            FREQUENTLY ASKED QUESTIONS
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-heading font-bold text-mbjj-blue mb-2">
                Q: Do my wins and losses matter for eligibility?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>A:</strong> No! Eligibility is based solely on participation (events attended and matches completed). Your actual win/loss record only affects your ladder ranking, not your eligibility status.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-heading font-bold text-mbjj-blue mb-2">
                Q: What if I get injured mid-season?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>A:</strong> If you've already met the eligibility requirements before injury, you remain eligible. If injured before meeting requirements, you won't be eligible for this season but are welcome back next season!
              </p>
            </div>

            <div>
              <h3 className="text-xl font-heading font-bold text-mbjj-blue mb-2">
                Q: Can I compete in multiple weight classes?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>A:</strong> Absolutely! You can compete in any weight class at any event, including bonus fights and superfights. All matches count toward your overall 6-match minimum.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                However, to be eligible for a <strong>specific weight class prize</strong>, you must have:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 ml-4">
                <li>At least 4 matches in that division</li>
                <li>More matches in that division than any other</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                If you tie (e.g., 7 LW and 7 MW), you're eligible for prizes in all tied divisions. You'll earn the Multi-Division ⚖️ badge for competing across divisions!
              </p>
            </div>

            <div>
              <h3 className="text-xl font-heading font-bold text-mbjj-blue mb-2">
                Q: How do I know if I'm eligible?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>A:</strong> Once you meet both requirements, you'll automatically receive the Prize Pool 💰 badge on your fighter profile.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-heading font-bold text-mbjj-blue mb-2">
                Q: What if I miss exactly 2 events?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>A:</strong> If you miss 2 events, you attended 3 events (5 - 2 = 3). That meets the minimum requirement! As long as you also have 6+ total matches, you're eligible for the prize pool.
              </p>
            </div>
          </div>
        </div>

        {/* Related Content */}
        <div className="bg-mbjj-dark text-white rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-heading font-bold mb-4 text-center">
            LEARN MORE ABOUT THE LEAGUE
          </h3>
          <div className="text-center">
            <Link
              href="/rankings-explained"
              className="inline-block bg-mbjj-blue hover:bg-blue-600 text-white font-heading font-bold px-8 py-3 rounded-lg transition shadow-md"
            >
              HOW RANKINGS & ELO WORK →
            </Link>
            <p className="text-gray-400 text-sm mt-3">
              Learn how our ELO system rewards consistency and improvement over time
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block bg-mbjj-red hover:bg-mbjj-accent-light text-white font-heading font-bold text-xl py-4 px-12 rounded-lg transition shadow-lg"
          >
            BACK TO HOME
          </Link>
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
