'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Fighter {
  id: number;
  name: string;
  weight: number;
  weight_class_id: number;
  belt_rank: string;
  match_count: number;
  match_ids: number[];
  needs_more_matches: boolean;
}

interface WeightClass {
  weight_class_id: number;
  weight_class_name: string;
  fighter_count: number;
  fighters: Array<{
    id: number;
    name: string;
    weight: number;
    match_count: number;
  }>;
}

interface PairingStats {
  event_id: number;
  event_name: string;
  total_fighters: number;
  total_matches: number;
  fighters_at_goal: number;
  goal_percentage: number;
  estimated_duration_minutes: number;
  estimated_duration_formatted: string;
  fighter_breakdown: {
    zero_matches: { count: number; fighters: Fighter[] };
    one_match: { count: number; fighters: Fighter[] };
    two_matches: { count: number; fighters: Fighter[] };
    three_plus_matches: { count: number; fighters: Fighter[] };
  };
  weight_class_distribution: WeightClass[];
  suggestions: Array<{
    priority: string;
    message: string;
    action: string;
  }>;
  all_fighters: Fighter[];
}

interface Match {
  id: number;
  match_number: number;
  player_a: { id: number; name: string };
  player_b: { id: number; name: string };
  weight_class_id: number;
  result: string | null;
}

export default function EventPairingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();

  const [stats, setStats] = useState<PairingStats | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFighter1, setSelectedFighter1] = useState<number | null>(null);
  const [selectedFighter2, setSelectedFighter2] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch pairing stats
      const statsRes = await fetch(`${API_URL}/api/tournaments/events/${eventId}/pairing-stats`);
      if (!statsRes.ok) throw new Error('Failed to fetch pairing stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch existing matches
      const matchesRes = await fetch(`${API_URL}/api/events/${eventId}/matches`);
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const validatePairing = (fighter1Id: number, fighter2Id: number): string | null => {
    if (!stats) return 'Stats not loaded';
    if (fighter1Id === fighter2Id) return 'Cannot pair a fighter with themselves';

    const fighter1 = stats.all_fighters.find((f) => f.id === fighter1Id);
    const fighter2 = stats.all_fighters.find((f) => f.id === fighter2Id);

    if (!fighter1 || !fighter2) return 'Fighter not found';

    const sameWeightClass = fighter1.weight_class_id === fighter2.weight_class_id;
    const weightDiff = Math.abs(fighter1.weight - fighter2.weight);
    const within30Lbs = weightDiff <= 30;

    if (!sameWeightClass && !within30Lbs) {
      return `Cannot pair: ${fighter1.name} (${fighter1.weight} lbs) and ${fighter2.name} (${fighter2.weight} lbs) are ${weightDiff.toFixed(1)} lbs apart (must be same weight class or within 30 lbs)`;
    }

    return null;
  };

  const createMatch = async () => {
    if (!selectedFighter1 || !selectedFighter2) {
      setValidationError('Please select two fighters');
      return;
    }

    const validation = validatePairing(selectedFighter1, selectedFighter2);
    if (validation) {
      setValidationError(validation);
      return;
    }

    setCreating(true);
    setValidationError(null);

    try {
      const res = await fetch(`${API_URL}/api/tournaments/events/${eventId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_a_id: selectedFighter1,
          player_b_id: selectedFighter2,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to create match');
      }

      // Reset selections
      setSelectedFighter1(null);
      setSelectedFighter2(null);

      // Refresh data
      await fetchData();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  const deleteMatch = async (matchId: number) => {
    if (!confirm('Delete this match?')) return;

    try {
      const res = await fetch(`${API_URL}/api/tournaments/matches/${matchId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete match');

      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const clearAllPairings = async () => {
    if (!confirm(`Are you sure you want to clear ALL ${stats?.total_matches || 0} match pairings? This cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/tournaments/events/${eventId}/matches/clear-all`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to clear pairings');
      }

      const result = await res.json();
      alert(`Successfully cleared ${result.deleted_count} match pairings`);

      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-gray-600">Loading pairing data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-gray-600">No data available</div>
      </div>
    );
  }

  const fighter1 = stats.all_fighters.find((f) => f.id === selectedFighter1);
  const fighter2 = stats.all_fighters.find((f) => f.id === selectedFighter2);
  const canCreateMatch = selectedFighter1 && selectedFighter2 && selectedFighter1 !== selectedFighter2;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Match Pairing</h1>
          <p className="text-gray-600">{stats.event_name}</p>
        </div>
        <div className="flex gap-3">
          {stats.total_matches > 0 && (
            <button
              onClick={clearAllPairings}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
            >
              Clear All Pairings ({stats.total_matches})
            </button>
          )}
          <button
            onClick={() => router.push(`/events/${eventId}`)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Event
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
          <div className="text-sm text-blue-600 font-semibold">Total Fighters</div>
          <div className="text-2xl font-bold text-blue-900">{stats.total_fighters}</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg border border-green-300">
          <div className="text-sm text-green-600 font-semibold">Total Matches</div>
          <div className="text-2xl font-bold text-green-900">{stats.total_matches}</div>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
          <div className="text-sm text-purple-600 font-semibold">At Goal (2-3 matches)</div>
          <div className="text-2xl font-bold text-purple-900">
            {stats.fighters_at_goal} / {stats.total_fighters}
            <span className="text-sm ml-2">({stats.goal_percentage}%)</span>
          </div>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg border border-orange-300">
          <div className="text-sm text-orange-600 font-semibold">Est. Duration</div>
          <div className="text-2xl font-bold text-orange-900">
            {stats.estimated_duration_formatted}
          </div>
          <div className="text-xs text-orange-600 mt-1">@ 10 min/match</div>
        </div>
      </div>

      {/* Suggestions */}
      {stats.suggestions.length > 0 && (
        <div className="space-y-2">
          {stats.suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${
                suggestion.priority === 'high'
                  ? 'bg-red-50 border-red-300 text-red-800'
                  : suggestion.priority === 'medium'
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                  : 'bg-green-50 border-green-300 text-green-800'
              }`}
            >
              <div className="font-semibold">{suggestion.message}</div>
              <div className="text-sm">{suggestion.action}</div>
            </div>
          ))}
        </div>
      )}

      {/* Match Creation */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Create Match</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fighter 1 Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">Fighter 1</label>
            <select
              value={selectedFighter1 || ''}
              onChange={(e) => setSelectedFighter1(Number(e.target.value) || null)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Select fighter...</option>
              {stats.all_fighters.map((fighter) => (
                <option key={fighter.id} value={fighter.id}>
                  {fighter.name} ({fighter.weight} lbs, {fighter.belt_rank}) - {fighter.match_count} matches
                </option>
              ))}
            </select>
            {fighter1 && (
              <div className="mt-2 text-sm text-gray-600">
                Weight: {fighter1.weight} lbs | Matches: {fighter1.match_count}
              </div>
            )}
          </div>

          {/* Fighter 2 Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">Fighter 2</label>
            <select
              value={selectedFighter2 || ''}
              onChange={(e) => setSelectedFighter2(Number(e.target.value) || null)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Select fighter...</option>
              {stats.all_fighters.map((fighter) => (
                <option key={fighter.id} value={fighter.id} disabled={fighter.id === selectedFighter1}>
                  {fighter.name} ({fighter.weight} lbs, {fighter.belt_rank}) - {fighter.match_count} matches
                </option>
              ))}
            </select>
            {fighter2 && (
              <div className="mt-2 text-sm text-gray-600">
                Weight: {fighter2.weight} lbs | Matches: {fighter2.match_count}
              </div>
            )}
          </div>
        </div>

        {/* Weight Difference Info */}
        {fighter1 && fighter2 && (
          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <div className="text-sm">
              <strong>Weight Difference:</strong> {Math.abs(fighter1.weight - fighter2.weight).toFixed(1)} lbs
            </div>
            <div className="text-sm">
              <strong>Same Weight Class:</strong>{' '}
              {fighter1.weight_class_id === fighter2.weight_class_id ? 'Yes' : 'No'}
            </div>
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {validationError}
          </div>
        )}

        {/* Create Button */}
        <div className="mt-4">
          <button
            onClick={createMatch}
            disabled={!canCreateMatch || creating}
            className={`px-6 py-3 rounded font-semibold ${
              canCreateMatch && !creating
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {creating ? 'Creating...' : 'Create Match'}
          </button>
        </div>
      </div>

      {/* Fighter Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fighters needing matches */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Fighters Needing Matches</h2>

          <div className="space-y-4">
            {stats.fighter_breakdown.zero_matches.count > 0 && (
              <div>
                <h3 className="font-semibold text-red-600 mb-2">
                  0 Matches ({stats.fighter_breakdown.zero_matches.count})
                </h3>
                <ul className="space-y-1 text-sm">
                  {stats.fighter_breakdown.zero_matches.fighters.map((f) => (
                    <li key={f.id} className="text-gray-700">
                      {f.name} ({f.weight} lbs)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stats.fighter_breakdown.one_match.count > 0 && (
              <div>
                <h3 className="font-semibold text-orange-600 mb-2">
                  1 Match ({stats.fighter_breakdown.one_match.count})
                </h3>
                <ul className="space-y-1 text-sm">
                  {stats.fighter_breakdown.one_match.fighters.map((f) => (
                    <li key={f.id} className="text-gray-700">
                      {f.name} ({f.weight} lbs)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Weight Class Distribution */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Weight Class Distribution</h2>

          <div className="space-y-4">
            {stats.weight_class_distribution.map((wc) => (
              <div key={wc.weight_class_id}>
                <h3 className="font-semibold mb-2">
                  {wc.weight_class_name} ({wc.fighter_count} fighters)
                </h3>
                <ul className="space-y-1 text-sm">
                  {wc.fighters.map((f) => (
                    <li key={f.id} className="text-gray-700">
                      {f.name} - {f.weight} lbs ({f.match_count} matches)
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Fighters Table */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">All Fighters</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Belt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.all_fighters.map((fighter) => (
                <tr key={fighter.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {fighter.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fighter.weight} lbs
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fighter.belt_rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fighter.match_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {fighter.match_count === 0 && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Needs Matches
                      </span>
                    )}
                    {fighter.match_count === 1 && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        1 Match
                      </span>
                    )}
                    {fighter.match_count >= 2 && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        At Goal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Existing Matches */}
      {matches.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Created Matches ({matches.length})</h2>
          <div className="space-y-2">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex-1">
                  <span className="font-semibold">Match #{match.match_number}:</span>{' '}
                  {match.player_a?.name || 'TBD'} vs {match.player_b?.name || 'TBD'}
                  {match.result && (
                    <span className="ml-2 text-sm text-gray-600">
                      (Result: {match.result})
                    </span>
                  )}
                </div>
                {!match.result && (
                  <button
                    onClick={() => deleteMatch(match.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
