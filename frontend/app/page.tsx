export default async function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  let stats = { players: 0, matches: 17 };

  try {
    const res = await fetch(`${apiUrl}/api/players`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const players = await res.json();
      stats.players = players.length;
    }
  } catch (e) {
    // Continue with default stats if API fails
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold">Vanguard League</h1>
          <p className="text-xl mt-2">VGI Trench — Submission-Only Ladder</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Welcome to the Vanguard League</h2>
          <p className="text-lg mb-4">
            A recurring submission-only competition series held in the VGI Trench.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2">No Judges</h3>
              <p>Pure submission-only competition. Tap or draw.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2">Weight Classes</h3>
              <p>Automatic ladder rankings by weight class and belt rank.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-2">Season Prizes</h3>
              <p>Top-ranked competitors earn from the prize pool.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Current Stats</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">{stats.players}</div>
              <div className="text-gray-600 dark:text-gray-300 mt-2">Active Players</div>
              <a href="/players" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                View Roster →
              </a>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-300">{stats.matches}</div>
              <div className="text-gray-600 dark:text-gray-300 mt-2">Matches Recorded</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a href="/players" className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition">
              <h3 className="font-bold text-lg">Players Roster</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">View all active competitors</p>
            </a>
            <a href={`${apiUrl}/docs`} target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition">
              <h3 className="font-bold text-lg">API Documentation</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Explore API endpoints</p>
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white p-6 mt-8">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 Vanguard Grappling Institute. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
