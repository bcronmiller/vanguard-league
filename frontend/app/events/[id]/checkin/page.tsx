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

export default function EventCheckinPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Handle both Promise and direct object for Next.js 15 compatibility
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const eventId = resolvedParams.id;
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [weights, setWeights] = useState<{ [key: number]: string }>({});
  const [selectedWeightClasses, setSelectedWeightClasses] = useState<{ [key: number]: number }>({});
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

  const loadWeightClasses = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/players`);
      if (res.ok) {
        // Weight classes: Lightweight (1), Middleweight (2), Heavyweight (3)
        setWeightClasses([
          { id: 1, name: 'Lightweight', min_lbs: 0, max_lbs: 170 },
          { id: 2, name: 'Middleweight', min_lbs: 171, max_lbs: 200 },
          { id: 3, name: 'Heavyweight', min_lbs: 201, max_lbs: 999 }
        ]);
      }
    } catch (error) {
      console.error('Failed to load weight classes:', error);
    }
  };

  const loadCheckinStatus = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/events/${eventId}/checkin-status`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);

        // Pre-fill weights with last known weights
        const initialWeights: { [key: number]: string } = {};
        const initialClasses: { [key: number]: number } = {};
        data.forEach((p: Player) => {
          if (p.last_known_weight) {
            initialWeights[p.id] = p.last_known_weight.toString();
            // Auto-select natural weight class
            initialClasses[p.id] = getNaturalWeightClass(p.last_known_weight);
          }
        });
        setWeights(initialWeights);
        setSelectedWeightClasses(initialClasses);
      }
    } catch (error) {
      console.error('Failed to load check-in status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNaturalWeightClass = (weight: number): number => {
    if (weight <= 170) return 1; // Lightweight
    if (weight <= 200) return 2; // Middleweight
    return 3; // Heavyweight
  };

  const getAvailableWeightClasses = (weight: number): WeightClass[] => {
    const natural = getNaturalWeightClass(weight);
    // Can only compete in natural class or heavier (fighting up)
    return weightClasses.filter(wc => wc.id >= natural);
  };

  const handleCheckin = async (playerId: number) => {
    const weight = parseFloat(weights[playerId]);
    if (!weight || weight <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    const weightClassId = selectedWeightClasses[playerId];
    if (!weightClassId) {
      alert('Please select a weight class');
      return;
    }

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
        const error = await res.json();
        alert(error.detail || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Check-in failed');
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
            WEIGHT CLASS SELECTION
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            Fighters can compete in their natural weight class or <strong>fight up</strong> to a heavier class.
            You cannot cut weight to compete in a lighter class.
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
            const availableClasses = currentWeight > 0 ? getAvailableWeightClasses(currentWeight) : [];

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
                            // Auto-update weight class when weight changes
                            if (e.target.value) {
                              const weight = parseFloat(e.target.value);
                              if (weight > 0) {
                                setSelectedWeightClasses({
                                  ...selectedWeightClasses,
                                  [player.id]: getNaturalWeightClass(weight)
                                });
                              }
                            }
                          }}
                          className="w-32 px-4 py-2 border border-gray-300 rounded-lg text-lg font-bold text-center dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          disabled={checkingIn === player.id}
                        />
                        <select
                          value={selectedWeightClasses[player.id] || ''}
                          onChange={(e) => setSelectedWeightClasses({ ...selectedWeightClasses, [player.id]: parseInt(e.target.value) })}
                          className="px-4 py-2 border border-gray-300 rounded-lg font-bold dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          disabled={checkingIn === player.id || currentWeight <= 0}
                        >
                          <option value="">Select Class</option>
                          {availableClasses.map(wc => (
                            <option key={wc.id} value={wc.id}>
                              {wc.name}
                            </option>
                          ))}
                        </select>
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
