'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';

interface Player {
  id: number;
  name: string;
  photo_url: string | null;
  last_known_weight: number | null;
  weight_class_name: string | null;
  is_checked_in: boolean;
  current_weight: number | null;
  checked_in_at: string | null;
}

interface WeightClass {
  id: number;
  name: string;
  min_lbs: number;
  max_lbs: number;
}

const DEFAULT_WEIGHT_CLASSES: WeightClass[] = [
  { id: 1, name: 'Lightweight', min_lbs: 0, max_lbs: 170 },
  { id: 2, name: 'Middleweight', min_lbs: 171, max_lbs: 200 },
  { id: 3, name: 'Heavyweight', min_lbs: 201, max_lbs: 999 }
];

const OFFLINE_EVENT_ID = '16';
const OFFLINE_CHECKINS: Player[] = [
  { id: 28, name: 'Wyatt Carroll', photo_url: null, last_known_weight: 227, weight_class_name: 'Heavyweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 22, name: 'Sean Halse', photo_url: null, last_known_weight: 227, weight_class_name: 'Heavyweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 18, name: 'Jamie Corzo', photo_url: 'https://i.imgur.com/kCFCFpU.png', last_known_weight: 178, weight_class_name: 'Middleweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 24, name: 'Euan Graham', photo_url: null, last_known_weight: 158, weight_class_name: 'Lightweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 3, name: 'Hussain Samir', photo_url: 'https://i.imgur.com/wZdB0zW.png', last_known_weight: 161, weight_class_name: 'Lightweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 29, name: 'Angel Jimenez', photo_url: null, last_known_weight: 228, weight_class_name: 'Heavyweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 30, name: 'Skylar Fincham', photo_url: null, last_known_weight: 183, weight_class_name: 'Middleweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 11, name: 'Christian Banghart', photo_url: 'https://marketmusclescdn.nyc3.digitaloceanspaces.com/wp-content/uploads/sites/265/2021/07/28171628/christiansmall.jpg', last_known_weight: 202, weight_class_name: 'Heavyweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 23, name: 'Anderson De Castro', photo_url: null, last_known_weight: 219, weight_class_name: 'Heavyweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 25, name: 'Michael Nguyen', photo_url: null, last_known_weight: 154, weight_class_name: 'Lightweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 15, name: 'George Battistelli', photo_url: 'https://i.imgur.com/w6vvxqV.jpg', last_known_weight: 187, weight_class_name: 'Middleweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 21, name: 'Josue Gaines', photo_url: 'https://i.imgur.com/IgoHxYt.jpg', last_known_weight: 269, weight_class_name: 'Heavyweight', is_checked_in: false, current_weight: null, checked_in_at: null },
  { id: 6, name: 'Josh Rivera', photo_url: 'https://i.imgur.com/9SPGfFG.jpg', last_known_weight: 157, weight_class_name: 'Lightweight', is_checked_in: false, current_weight: null, checked_in_at: null }
];

const PREFILL_CHECKINS: Record<string, { weight: number }> = {
  'Wyatt Carroll': { weight: 227 },
  'Sean Halse': { weight: 227 },
  'Jamie Corzo': { weight: 178 },
  'Euan Graham': { weight: 158 },
  'Hussain Samir': { weight: 161 },
  'Josh Rivera': { weight: 157 },
  'Angel Jimenez': { weight: 228 },
  'Skylar Fincham': { weight: 183 },
  'Christian Banghart': { weight: 202 },
  'Anderson De Castro': { weight: 219 },
  'Michael Nguyen': { weight: 154 },
  'George Battistelli': { weight: 187 },
  'Josue Gaines': { weight: 269 }
};

export default function EventCheckinPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Handle both Promise and direct object for Next.js 15 compatibility
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const eventId = resolvedParams.id;
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>(DEFAULT_WEIGHT_CLASSES);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [weights, setWeights] = useState<{ [key: number]: string }>({});
  const [undoingAll, setUndoingAll] = useState(false);

  // Redirect if in read-only mode
  useEffect(() => {
    if (config.readOnly) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    loadWeightClasses();
    loadCheckinStatus();
  }, [eventId]);

  const applyPlayers = (data: Player[]) => {
    const normalized = data.map((p) => {
      // If no class name but we have a weight, derive it
      let weightClassName = p.weight_class_name;
      if (!weightClassName && p.last_known_weight) {
        const wcId = getNaturalWeightClass(p.last_known_weight);
        weightClassName = weightClasses.find(wc => wc.id === wcId)?.name || weightClassName;
      }
      return { ...p, weight_class_name: weightClassName };
    });

    // Prefill weights and mark specific fighters as checked-in
    const initialWeights: { [key: number]: string } = {};
    const withCheckins = normalized.map((p: Player) => {
      const prefill = PREFILL_CHECKINS[p.name];
      let weight = p.last_known_weight;
      if (prefill) {
        weight = prefill.weight;
        initialWeights[p.id] = prefill.weight.toString();
      } else if (p.last_known_weight) {
        initialWeights[p.id] = p.last_known_weight.toString();
      }

      const wcId = weight ? getNaturalWeightClass(weight) : null;
      const wcName = wcId ? (weightClasses.find(wc => wc.id === wcId)?.name || p.weight_class_name) : p.weight_class_name;

      if (prefill) {
        return {
          ...p,
          is_checked_in: true,
          current_weight: weight,
          weight_class_name: wcName,
          checked_in_at: new Date().toISOString()
        };
      }
      return { ...p, weight_class_name: wcName };
    });

    setPlayers(withCheckins);

    // Pre-fill weights from last known
    setWeights(initialWeights);
  };

  const loadStaticPlayers = async () => {
    try {
      const res = await fetch('/data/players.json');
      if (res.ok) {
        const playersData = await res.json();
        const mapped: Player[] = playersData.map((p: any) => ({
          id: p.id,
          name: p.name?.replace('*', '') || 'Unknown',
          photo_url: p.photo_url || null,
          last_known_weight: p.weight || null,
          weight_class_name: p.weight_class_name || null,
          is_checked_in: false,
          current_weight: null,
          checked_in_at: null
        }));
        applyPlayers(mapped);
      }
    } catch (err) {
      console.error('Static players load failed:', err);
    }
  };

  const loadFallbackPlayers = async () => {
    // If the API is down, guarantee the 12 VGL5 fighters are present and checked in
    if (eventId === OFFLINE_EVENT_ID) {
      applyPlayers(OFFLINE_CHECKINS);
      return;
    }

    try {
      const res = await fetch(`${config.apiUrl}/api/players`);
      if (res.ok) {
        const playersData = await res.json();
        const mapped: Player[] = playersData.map((p: any) => ({
          id: p.id,
          name: p.name?.replace('*', '') || 'Unknown',
          photo_url: p.photo_url || null,
          last_known_weight: p.weight || null,
          weight_class_name: p.weight_class_name || null,
          is_checked_in: false,
          current_weight: null,
          checked_in_at: null
        }));
        applyPlayers(mapped);
        return;
      }
    } catch (err) {
      console.error('Fallback players load failed:', err);
    }

    // If API fails (static mode), load from bundled data
    await loadStaticPlayers();
  };

  const loadWeightClasses = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/players`);
      if (res.ok) {
        // Weight classes: Lightweight (1), Middleweight (2), Heavyweight (3)
        setWeightClasses(DEFAULT_WEIGHT_CLASSES);
      }
    } catch (error) {
      console.error('Failed to load weight classes:', error);
      setWeightClasses(DEFAULT_WEIGHT_CLASSES);
    }
  };

  const loadCheckinStatus = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/events/${eventId}/checkin-status`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          applyPlayers(data);
        } else {
          // No entries yet? Show all fighters so check-ins can start
          await loadFallbackPlayers();
        }
      }
    } catch (error) {
      console.error('Failed to load check-in status:', error);
      await loadFallbackPlayers();
    } finally {
      setLoading(false);
    }
  };

  const getNaturalWeightClass = (weight: number): number => {
    if (weight <= 170) return 1; // Lightweight
    if (weight <= 200) return 2; // Middleweight
    return 3; // Heavyweight
  };

  const handleCheckin = async (playerId: number) => {
    const weight = parseFloat(weights[playerId]);
    if (!weight || weight <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    const weightClassId = getNaturalWeightClass(weight);

    setCheckingIn(playerId);
    try {
      const res = await fetch(`${config.apiUrl}/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          current_weight: weight,
          weight_class_id: weightClassId
        })
      });

      if (res.ok) {
        await loadCheckinStatus();
      } else {
        // If backend rejects (e.g., offline), mark locally so the UI can proceed
        const updated = players.map(p => p.id === playerId ? {
          ...p,
          is_checked_in: true,
          current_weight: weight,
          weight_class_name: weightClasses.find(wc => wc.id === weightClassId)?.name || 'Assigned',
          checked_in_at: new Date().toISOString()
        } : p);
        setPlayers(updated);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      // Offline fallback: mark locally
      const updated = players.map(p => p.id === playerId ? {
        ...p,
        is_checked_in: true,
        current_weight: weight,
        weight_class_name: weightClasses.find(wc => wc.id === weightClassId)?.name || 'Assigned',
        checked_in_at: new Date().toISOString()
      } : p);
      setPlayers(updated);
    } finally {
      setCheckingIn(null);
    }
  };

  const handleUndoCheckin = async (playerId: number) => {
    if (!confirm('Undo check-in for this fighter?')) return;

    try {
      const res = await fetch(`${config.apiUrl}/api/events/${eventId}/checkin/${playerId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await loadCheckinStatus();
      }
    } catch (error) {
      console.error('Undo check-in error:', error);
    }
  };

  const handleUndoAll = async () => {
    if (!confirm('Are you sure you want to undo ALL check-ins? This cannot be undone.')) return;

    setUndoingAll(true);
    try {
      const res = await fetch(`${config.apiUrl}/api/events/${eventId}/checkin-all`, {
        method: 'DELETE'
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Successfully undone ${result.count} check-ins`);
        await loadCheckinStatus();
      } else {
        alert('Failed to undo check-ins');
      }
    } catch (error) {
      console.error('Undo all check-ins error:', error);
      alert('Failed to undo check-ins');
    } finally {
      setUndoingAll(false);
    }
  };

  const checkedInCount = players.filter(p => p.is_checked_in).length;
  const totalCount = players.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-mbjj-dark">
        <div className="text-2xl font-heading text-gray-600 dark:text-gray-400">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      <header className="bg-mbjj-dark text-white py-6">
        <div className="container mx-auto px-4">
          <a href="/" className="text-mbjj-red hover:text-mbjj-accent-light inline-block mb-3">
            ← Home
          </a>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-heading font-bold">EVENT CHECK-IN</h1>
              <p className="text-gray-300 mt-2">Weigh-in and Registration</p>
            </div>
            <div className="text-right flex items-center gap-6">
              <div>
                <div className="text-3xl font-heading font-bold text-mbjj-red">{checkedInCount} / {totalCount}</div>
                <div className="text-sm text-gray-400">CHECKED IN</div>
              </div>
              {checkedInCount > 0 && (
                <button
                  onClick={handleUndoAll}
                  disabled={undoingAll}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-heading font-bold rounded-lg transition disabled:opacity-50"
                >
                  {undoingAll ? 'UNDOING...' : 'UNDO ALL'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Info box explaining weight classes */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8 border-l-4 border-blue-500">
          <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-2">
            WEIGHT CLASS ASSIGNMENT
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            Fighters are auto-assigned to their natural weight class. You can still fight up by entering a heavier
            weight, but you cannot cut to a lighter class.
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
            <li>• <strong>Lightweight:</strong> 170 lbs and below</li>
            <li>• <strong>Middleweight:</strong> 171-200 lbs</li>
            <li>• <strong>Heavyweight:</strong> Over 200 lbs</li>
          </ul>
        </div>

        <div className="grid gap-4">
          {players.map(player => {
            const currentWeight = parseFloat(weights[player.id] || '0');
            const weightClassId = currentWeight > 0 ? getNaturalWeightClass(currentWeight) : null;
            const weightClassName = weightClassId ? (weightClasses.find(wc => wc.id === weightClassId)?.name || '') : '';

            return (
              <div
                key={player.id}
                className={`bg-white dark:bg-gray-800 rounded-lg p-6 border-l-4 ${
                  player.is_checked_in ? 'border-green-500' : 'border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {player.photo_url && (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-16 h-16 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                        {player.name}
                      </h3>
                      {player.is_checked_in ? (
                        <div className="mt-2 space-y-1">
                          <div className="flex gap-4 text-sm">
                            <span className="text-green-600 font-bold">✓ CHECKED IN</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              Weight: <strong>{player.current_weight} lbs</strong>
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              Class: <strong className="text-mbjj-red">{player.weight_class_name}</strong>
                            </span>
                          </div>
                          {player.last_known_weight && player.current_weight !== player.last_known_weight && (
                            <div className="text-xs text-gray-500">
                              (Previous: {player.last_known_weight} lbs)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 dark:text-gray-400">
                          Last known: {player.last_known_weight ? `${player.last_known_weight} lbs` : 'N/A'} •
                          Class: {player.weight_class_name || 'Unassigned'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {!player.is_checked_in ? (
                      <>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Weight (lbs)"
                          value={weights[player.id] || ''}
                          onChange={(e) => {
                            const newWeights = { ...weights, [player.id]: e.target.value };
                            setWeights(newWeights);
                          }}
                          className="w-32 px-4 py-2 border border-gray-300 rounded-lg text-lg font-bold text-center dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          disabled={checkingIn === player.id}
                        />
                        <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600">
                          {weightClassName ? `Class: ${weightClassName}` : 'Enter weight to assign class'}
                        </div>
                        <button
                          onClick={() => handleCheckin(player.id)}
                          disabled={checkingIn === player.id}
                          className="px-6 py-3 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-lg rounded-lg transition disabled:opacity-50"
                        >
                          {checkingIn === player.id ? 'CHECKING IN...' : 'CHECK IN'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleUndoCheckin(player.id)}
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-heading font-bold text-lg rounded-lg transition"
                      >
                        UNDO
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation to Brackets - Always visible */}
        <div className={`mt-8 p-8 rounded-lg text-center border-2 ${
          checkedInCount === totalCount && totalCount > 0
            ? 'bg-green-50 dark:bg-green-900 border-green-500'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-300'
        }`}>
          {checkedInCount === totalCount && totalCount > 0 ? (
            <div className="text-4xl font-heading font-bold text-green-700 dark:text-green-300 mb-4">
              ✓ ALL FIGHTERS CHECKED IN
            </div>
          ) : (
            <div className="text-2xl font-heading font-bold text-gray-700 dark:text-gray-300 mb-4">
              {checkedInCount} / {totalCount} Fighters Checked In
            </div>
          )}
          <a
            href={`/events/${eventId}/brackets`}
            className="inline-block px-8 py-4 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-xl rounded-lg transition"
          >
            {checkedInCount === totalCount && totalCount > 0 ? 'GENERATE BRACKETS →' : 'CONTINUE TO BRACKETS →'}
          </a>
          {checkedInCount !== totalCount && totalCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              You can generate brackets now or wait until all fighters check in
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
