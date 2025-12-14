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

const OFFLINE_EVENT_ID = '16';
const OFFLINE_EVENT_NAME = 'VGL Season 1 Finale (Ep 5)';
const OFFLINE_FIGHTERS: Fighter[] = [
  { id: 28, name: 'Wyatt Carroll', weight: 227, weight_class_id: 3, belt_rank: 'Brown', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 22, name: 'Sean Halse', weight: 227, weight_class_id: 3, belt_rank: 'Blue', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 29, name: 'Angel Jimenez', weight: 228, weight_class_id: 3, belt_rank: 'Unspecified', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 11, name: 'Christian Banghart', weight: 202, weight_class_id: 3, belt_rank: 'Black', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 23, name: 'Anderson De Castro', weight: 219, weight_class_id: 3, belt_rank: 'Purple', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 21, name: 'Josue Gaines', weight: 269, weight_class_id: 3, belt_rank: 'Blue', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 18, name: 'Jamie Corzo', weight: 178, weight_class_id: 2, belt_rank: 'Blue', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 30, name: 'Skylar Fincham', weight: 183, weight_class_id: 2, belt_rank: 'Blue', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 15, name: 'George Battistelli', weight: 187, weight_class_id: 2, belt_rank: 'Purple', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 24, name: 'Euan Graham', weight: 158, weight_class_id: 1, belt_rank: 'White', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 3, name: 'Hussain Samir', weight: 161, weight_class_id: 1, belt_rank: 'Blue', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 25, name: 'Michael Nguyen', weight: 154, weight_class_id: 1, belt_rank: 'Blue', match_count: 0, match_ids: [], needs_more_matches: true },
  { id: 6, name: 'Josh Rivera', weight: 157, weight_class_id: 1, belt_rank: 'Blue', match_count: 0, match_ids: [], needs_more_matches: true }
];

const OFFLINE_MATCHES: Match[] = [
  { id: 1601, match_number: 1, player_a: { id: 28, name: 'Wyatt Carroll' }, player_b: { id: 22, name: 'Sean Halse' }, weight_class_id: 3, result: null },
  { id: 1602, match_number: 2, player_a: { id: 29, name: 'Angel Jimenez' }, player_b: { id: 11, name: 'Christian Banghart' }, weight_class_id: 3, result: null },
  { id: 1603, match_number: 3, player_a: { id: 23, name: 'Anderson De Castro' }, player_b: { id: 21, name: 'Josue Gaines' }, weight_class_id: 3, result: null },
  { id: 1604, match_number: 4, player_a: { id: 28, name: 'Wyatt Carroll' }, player_b: { id: 29, name: 'Angel Jimenez' }, weight_class_id: 3, result: null },
  { id: 1605, match_number: 5, player_a: { id: 22, name: 'Sean Halse' }, player_b: { id: 23, name: 'Anderson De Castro' }, weight_class_id: 3, result: 'b_win' },
  { id: 1606, match_number: 6, player_a: { id: 11, name: 'Christian Banghart' }, player_b: { id: 21, name: 'Josue Gaines' }, weight_class_id: 3, result: null },
  { id: 1607, match_number: 7, player_a: { id: 18, name: 'Jamie Corzo' }, player_b: { id: 30, name: 'Skylar Fincham' }, weight_class_id: 2, result: null },
  { id: 1608, match_number: 8, player_a: { id: 18, name: 'Jamie Corzo' }, player_b: { id: 15, name: 'George Battistelli' }, weight_class_id: 2, result: null },
  { id: 1609, match_number: 9, player_a: { id: 30, name: 'Skylar Fincham' }, player_b: { id: 15, name: 'George Battistelli' }, weight_class_id: 2, result: null },
  { id: 1610, match_number: 10, player_a: { id: 24, name: 'Euan Graham' }, player_b: { id: 3, name: 'Hussain Samir' }, weight_class_id: 1, result: null },
  { id: 1611, match_number: 11, player_a: { id: 24, name: 'Euan Graham' }, player_b: { id: 25, name: 'Michael Nguyen' }, weight_class_id: 1, result: null },
  { id: 1612, match_number: 12, player_a: { id: 3, name: 'Hussain Samir' }, player_b: { id: 25, name: 'Michael Nguyen' }, weight_class_id: 1, result: null },
  { id: 1613, match_number: 13, player_a: { id: 3, name: 'Hussain Samir' }, player_b: { id: 6, name: 'Josh Rivera' }, weight_class_id: 1, result: 'a_win' },
  { id: 1614, match_number: 14, player_a: { id: 15, name: 'George Battistelli' }, player_b: { id: 6, name: 'Josh Rivera' }, weight_class_id: 2, result: 'a_win' },
  { id: 1615, match_number: 15, player_a: { id: 21, name: 'Josue Gaines' }, player_b: { id: 29, name: 'Angel Jimenez' }, weight_class_id: 3, result: 'draw' },
  { id: 1616, match_number: 16, player_a: { id: 6, name: 'Josh Rivera' }, player_b: { id: 24, name: 'Euan Graham' }, weight_class_id: 1, result: 'a_win' }
];

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
  const [offlineMode, setOfflineMode] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const getWeightClassName = (weightClassId: number) => {
    if (weightClassId === 1) return 'Lightweight';
    if (weightClassId === 2) return 'Middleweight';
    return 'Heavyweight';
  };

  const buildOfflineStats = (fighters: Fighter[], currentMatches: Match[]): PairingStats => {
    const counts: Record<number, { matchCount: number; matchIds: number[] }> = {};
    fighters.forEach((f) => {
      counts[f.id] = { matchCount: 0, matchIds: [] };
    });

    currentMatches.forEach((match) => {
      if (match.player_a?.id && counts[match.player_a.id]) {
        counts[match.player_a.id].matchCount += 1;
        counts[match.player_a.id].matchIds.push(match.id);
      }
      if (match.player_b?.id && counts[match.player_b.id]) {
        counts[match.player_b.id].matchCount += 1;
        counts[match.player_b.id].matchIds.push(match.id);
      }
    });

    const enriched = fighters.map((f) => {
      const playerCounts = counts[f.id] || { matchCount: 0, matchIds: [] };
      return {
        ...f,
        match_count: playerCounts.matchCount,
        match_ids: playerCounts.matchIds,
        needs_more_matches: playerCounts.matchCount < 2
      };
    });

    const totalMatches = currentMatches.length;
    const totalFighters = enriched.length;
    const fightersAtGoal = enriched.filter((f) => f.match_count >= 2).length;
    const zeroMatches = enriched.filter((f) => f.match_count === 0);
    const oneMatch = enriched.filter((f) => f.match_count === 1);
    const twoMatches = enriched.filter((f) => f.match_count === 2);
    const threePlus = enriched.filter((f) => f.match_count >= 3);
    const goalPercentage = totalFighters > 0 ? Math.round((fightersAtGoal / totalFighters) * 1000) / 10 : 0;

    const weightClassDistribution: WeightClass[] = [];
    enriched.forEach((f) => {
      let wc = weightClassDistribution.find((w) => w.weight_class_id === f.weight_class_id);
      if (!wc) {
        wc = { weight_class_id: f.weight_class_id, weight_class_name: getWeightClassName(f.weight_class_id), fighter_count: 0, fighters: [] };
        weightClassDistribution.push(wc);
      }
      wc.fighter_count += 1;
      wc.fighters.push({ id: f.id, name: f.name, weight: f.weight, match_count: f.match_count });
    });

    const suggestions: PairingStats['suggestions'] = [];
    if (zeroMatches.length >= 2) {
      suggestions.push({
        priority: 'high',
        message: `${zeroMatches.length} fighters have no matches yet`,
        action: 'Pair fighters with 0 matches first'
      });
    }
    if (oneMatch.length >= 2) {
      suggestions.push({
        priority: 'medium',
        message: `${oneMatch.length} fighters have only 1 match`,
        action: 'Pair fighters with 1 match to reach the 2-3 goal'
      });
    }
    if (goalPercentage >= 100) {
      suggestions.push({
        priority: 'success',
        message: 'All fighters have 2+ matches!',
        action: 'Pairing goal achieved'
      });
    }

    return {
      event_id: Number(eventId),
      event_name: OFFLINE_EVENT_NAME,
      total_fighters: totalFighters,
      total_matches: totalMatches,
      fighters_at_goal: fightersAtGoal,
      goal_percentage: goalPercentage,
      estimated_duration_minutes: totalMatches * 10,
      estimated_duration_formatted: `${Math.floor((totalMatches * 10) / 60)}h ${(totalMatches * 10) % 60}m`,
      fighter_breakdown: {
        zero_matches: { count: zeroMatches.length, fighters: zeroMatches.sort((a, b) => a.name.localeCompare(b.name)) },
        one_match: { count: oneMatch.length, fighters: oneMatch.sort((a, b) => a.name.localeCompare(b.name)) },
        two_matches: { count: twoMatches.length, fighters: twoMatches.sort((a, b) => a.name.localeCompare(b.name)) },
        three_plus_matches: { count: threePlus.length, fighters: threePlus.sort((a, b) => a.name.localeCompare(b.name)) }
      },
      weight_class_distribution: weightClassDistribution,
      suggestions,
      all_fighters: enriched.sort((a, b) => (a.match_count - b.match_count) || a.name.localeCompare(b.name))
    };
  };

  const useOfflineData = () => {
    const offlineStats = buildOfflineStats(OFFLINE_FIGHTERS, OFFLINE_MATCHES);
    setStats(offlineStats);
    setMatches(OFFLINE_MATCHES);
    setOfflineMode(true);
    setError(null);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setOfflineMode(false);

      // Fetch pairing stats
      const statsRes = await fetch(`${API_URL}/api/tournaments/events/${eventId}/pairing-stats`);
      if (!statsRes.ok) throw new Error('Failed to fetch pairing stats');
      const statsData = await statsRes.json();

      // If the API is empty or offline, pre-load VGL5 with 12 checked-in fighters and 2 matches each
      if (eventId === OFFLINE_EVENT_ID && (!statsData || statsData.total_fighters === 0)) {
        useOfflineData();
        setLoading(false);
        return;
      }

      setStats(statsData);

      const matchesRes = await fetch(`${API_URL}/api/events/${eventId}/matches`);
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData);
      }

      setError(null);
    } catch (err) {
      if (eventId === OFFLINE_EVENT_ID) {
        useOfflineData();
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
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
      if (offlineMode && stats) {
        const nextMatchNumber = matches.length > 0 ? Math.max(...matches.map((m) => m.match_number)) + 1 : 1;
        const newMatch: Match = {
          id: Date.now(),
          match_number: nextMatchNumber,
          player_a: { id: selectedFighter1, name: fighter1.name },
          player_b: { id: selectedFighter2, name: fighter2.name },
          weight_class_id: fighter1.weight_class_id === fighter2.weight_class_id ? fighter1.weight_class_id : Math.max(fighter1.weight_class_id, fighter2.weight_class_id),
          result: null
        };
        const nextMatches = [...matches, newMatch];
        setMatches(nextMatches);
        setStats(buildOfflineStats(OFFLINE_FIGHTERS, nextMatches));
        setSelectedFighter1(null);
        setSelectedFighter2(null);
        setCreating(false);
        return;
      }

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
      if (offlineMode && stats) {
        const nextMatches = matches.filter((m) => m.id !== matchId);
        setMatches(nextMatches);
        setStats(buildOfflineStats(OFFLINE_FIGHTERS, nextMatches));
        return;
      }

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
      if (offlineMode) {
        setMatches([]);
        setStats(buildOfflineStats(OFFLINE_FIGHTERS, []));
        setLoading(false);
        return;
      }
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

      {offlineMode && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded">
          Offline fallback active: VGL5 is preloaded with 12 checked-in fighters and two matches each. Pairing changes stay local until the API comes back.
        </div>
      )}

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
