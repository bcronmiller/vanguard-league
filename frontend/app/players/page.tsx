export default async function PlayersPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  let players = [];
  let error = null;

  try {
    const res = await fetch(`${apiUrl}/api/players`, {
      cache: 'no-store' // Always get fresh data
    });

    if (res.ok) {
      players = await res.json();
    } else {
      error = 'Failed to fetch players';
    }
  } catch (e) {
    error = 'Could not connect to API';
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold">Vanguard League</h1>
          <p className="text-xl mt-2">Players Roster</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Belt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rankade ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {players.length === 0 && !error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No players found
                  </td>
                </tr>
              ) : (
                players.map((player: any, index: number) => (
                  <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {player.photo_url && (
                          <img
                            src={player.photo_url}
                            alt={player.name}
                            className="h-10 w-10 rounded-full mr-3"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {player.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {player.belt || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {player.team || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {player.rankade_id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          Total Players: {players.length}
        </div>
      </main>

      <footer className="bg-gray-900 text-white p-6 mt-8">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 Vanguard Grappling Institute. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
