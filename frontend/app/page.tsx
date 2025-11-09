export default function Home() {
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

        <section>
          <h2 className="text-2xl font-bold mb-4">Leaderboards</h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <p className="text-gray-600 dark:text-gray-400">
              Leaderboards will be displayed here once the backend is connected.
            </p>
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
