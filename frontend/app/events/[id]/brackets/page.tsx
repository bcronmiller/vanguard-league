'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';
import BracketTree from '@/components/BracketTree';
import MatchModal from '@/components/MatchModal';

interface Player {
  id: number;
  name: string;
  photo_url: string | null;
}

interface Match {
  id: number;
  bracket_round_id: number | null;
  match_number: number | null;
  a_player_id: number | null;
  b_player_id: number | null;
  result: string | null;
  method: string | null;
  match_status: string;
  depends_on_match_a: number | null;
  depends_on_match_b: number | null;
  duration_seconds: number | null;
}

interface BracketRound {
  id: number;
  round_number: number;
  round_name: string | null;
  bracket_type: string | null;
  status: string;
}

interface BracketFormat {
  id: number;
  event_id: number;
  weight_class_id: number | null;
  format_type: string;
  is_generated: boolean;
  is_finalized: boolean;
}

export default function BracketsPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Handle both Promise and direct object for Next.js 15 compatibility
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const eventId = resolvedParams.id;
  const router = useRouter();

  const [brackets, setBrackets] = useState<BracketFormat[]>([]);
  const [selectedBracket, setSelectedBracket] = useState<BracketFormat | null>(null);
  const [rounds, setRounds] = useState<BracketRound[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Record<number, Player>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any | null>(null);
  const [selectedWeightClass, setSelectedWeightClass] = useState<number | null>(null); // null = all fighters
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  // Format recommendations
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [timeBudget, setTimeBudget] = useState(60); // Default: 1 hour
  const [matchDuration, setMatchDuration] = useState(10);
  const [numFighters, setNumFighters] = useState(0);

  // Redirect if in read-only mode
  useEffect(() => {
    if (config.readOnly) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    loadBrackets();
    loadPlayers();
    loadRecommendations();
  }, [eventId]);

  useEffect(() => {
    loadRecommendations();
  }, [timeBudget, matchDuration, eventId]);

  useEffect(() => {
    if (selectedBracket) {
      loadBracketData(selectedBracket.id);
    }
  }, [selectedBracket]);

  const loadBrackets = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/tournaments/events/${eventId}/brackets`);
      if (res.ok) {
        const data = await res.json();
        setBrackets(data);
        if (data.length > 0) {
          setSelectedBracket(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load brackets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/players`);
      if (res.ok) {
        const data = await res.json();
        const playerMap: Record<number, Player> = {};
        data.forEach((player: Player) => {
          playerMap[player.id] = player;
        });
        setPlayers(playerMap);
      }
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const res = await fetch(
        `${config.apiUrl}/api/tournaments/events/${eventId}/format-recommendations?time_budget_minutes=${timeBudget}&match_duration_minutes=${matchDuration}`
      );
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setNumFighters(data.num_fighters || 0);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const loadBracketData = async (bracketId: number) => {
    try {
      // Load rounds
      const roundsRes = await fetch(`${config.apiUrl}/api/tournaments/brackets/${bracketId}/rounds`);
      if (roundsRes.ok) {
        const roundsData = await roundsRes.json();
        setRounds(roundsData);
      }

      // Load matches
      const matchesRes = await fetch(`${config.apiUrl}/api/tournaments/brackets/${bracketId}/matches`);
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData);
      }
    } catch (error) {
      console.error('Failed to load bracket data:', error);
    }
  };

  const createAndGenerateBracket = async () => {
    if (!selectedRecommendation) {
      alert('Please select a bracket format');
      return;
    }

    const weightClassName = selectedWeightClass === 1 ? 'Lightweight' :
                           selectedWeightClass === 2 ? 'Middleweight' :
                           selectedWeightClass === 3 ? 'Heavyweight' : 'All Fighters';

    if (!confirm(`Generate ${selectedRecommendation.format_name} bracket for ${weightClassName}?\n\nThis will create match pairings.`)) return;

    setGenerating(true);
    try {
      const bracketConfig: any = {};

      // For guaranteed_matches, include match_count
      if (selectedRecommendation.format === 'guaranteed_matches') {
        bracketConfig.match_count = selectedRecommendation.matches_per_fighter;
        bracketConfig.weight_based_pairing = true;  // Enable weight-based pairing
      }

      // Step 1: Create bracket
      const createRes = await fetch(`${config.apiUrl}/api/tournaments/brackets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: parseInt(eventId),
          weight_class_id: selectedWeightClass, // null = all fighters, or specific weight class ID
          format_type: selectedRecommendation.format,
          config: bracketConfig,
          min_rest_minutes: 30
        })
      });

      if (!createRes.ok) {
        throw new Error('Failed to create bracket');
      }

      const bracket = await createRes.json();

      // Step 2: Generate rounds/matches
      const generateRes = await fetch(`${config.apiUrl}/api/tournaments/brackets/${bracket.id}/generate`, {
        method: 'POST',
      });

      if (!generateRes.ok) {
        throw new Error('Failed to generate bracket');
      }

      // Reload brackets
      await loadBrackets();
      alert('Bracket generated successfully!');
    } catch (error) {
      console.error('Bracket generation error:', error);
      alert(`Failed to generate bracket: ${error}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleMatchClick = (matchId: number) => {
    setSelectedMatchId(matchId);
    setModalOpen(true);
  };

  const handleResultSubmitted = () => {
    // Reload bracket data after result is submitted
    if (selectedBracket) {
      loadBracketData(selectedBracket.id);
    }
  };

  const completedMatches = matches.filter(m => m.result).length;
  const totalMatches = matches.length;

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
          <div className="flex gap-4 mb-3">
            <a href="/" className="text-mbjj-red hover:text-mbjj-accent-light">
              ← Home
            </a>
            <span className="text-gray-600">|</span>
            <a href={`/events/${eventId}/checkin`} className="text-mbjj-red hover:text-mbjj-accent-light">
              ← Check-In
            </a>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-heading font-bold mt-2">MATCH BRACKETS</h1>
              <p className="text-gray-300 mt-2">Event Management & Results</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-heading font-bold text-mbjj-red">{completedMatches} / {totalMatches}</div>
              <div className="text-sm text-gray-400">MATCHES COMPLETE</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {matches.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12">
            <h2 className="text-3xl font-heading font-bold mb-6 text-center">NO BRACKETS YET</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
              {numFighters} checked-in fighters • Select a bracket format
            </p>

            {/* Weight Class Selector */}
            <div className="max-w-2xl mx-auto mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-heading font-bold mb-4 text-gray-900 dark:text-white">Weight Class (IMPORTANT)</h3>
              <select
                value={selectedWeightClass || ''}
                onChange={(e) => setSelectedWeightClass(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 border-2 rounded-lg dark:bg-gray-800 dark:border-gray-700 text-lg font-medium"
              >
                <option value="">All Fighters (Mixed Weight)</option>
                <option value="1">Lightweight (Under 170 lbs)</option>
                <option value="2">Middleweight (170-200 lbs)</option>
                <option value="3">Heavyweight (Over 200 lbs)</option>
              </select>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                Select a specific weight class to only include fighters checked in for that division
              </p>
            </div>

            {/* Settings */}
            <div className="max-w-2xl mx-auto mb-8 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
              <h3 className="font-heading font-bold mb-4">Event Time Budget</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Time Budget (minutes)</label>
                  <select
                    value={timeBudget}
                    onChange={(e) => setTimeBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="40">40 min (quick)</option>
                    <option value="60">60 min (1 hour)</option>
                    <option value="90">90 min (1.5 hours)</option>
                    <option value="120">120 min (2 hours)</option>
                    <option value="180">180 min (3 hours)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Total time per weight class including 2-min gaps
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Match Duration (minutes)</label>
                  <select
                    value={matchDuration}
                    onChange={(e) => setMatchDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="5">5 min (huge turnout)</option>
                    <option value="10">10 min (standard)</option>
                    <option value="15">15 min (extended)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Time limit per match
                  </p>
                </div>
              </div>
            </div>

            {/* Format Recommendations */}
            <div className="max-w-2xl mx-auto space-y-3 mb-8">
              {recommendations.map((rec, index) => {
                const isSelected = selectedRecommendation?.format === rec.format && selectedRecommendation?.matches_per_fighter === rec.matches_per_fighter;
                const fitsInBudget = rec.fits_in_budget !== undefined ? rec.fits_in_budget : rec.in_range;

                return (
                  <button
                    key={`${rec.format}-${rec.matches_per_fighter || index}`}
                    onClick={() => setSelectedRecommendation(rec)}
                    className={`w-full p-4 rounded-lg border-2 font-heading text-left transition ${
                      isSelected
                        ? 'border-mbjj-red bg-mbjj-red text-white'
                        : fitsInBudget
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 hover:border-green-600'
                        : 'border-gray-300 dark:border-gray-700 hover:border-mbjj-red'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg uppercase">{rec.format_name}</span>
                          {fitsInBudget && <span className="text-green-600 dark:text-green-400">✓ Fits</span>}
                        </div>
                        <div className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                          {rec.matches_per_fighter && `${rec.matches_per_fighter} matches per fighter • `}
                          {rec.match_count} total matches
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`font-bold text-xl ${isSelected ? 'text-white' : 'text-mbjj-red'}`}>
                          {rec.estimated_time_display}
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                          with 2-min gaps
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-center">
              <button
                onClick={createAndGenerateBracket}
                disabled={generating || numFighters < 2}
                className="px-12 py-4 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-2xl rounded-lg transition disabled:opacity-50"
              >
                {generating ? 'GENERATING...' : 'GENERATE BRACKETS'}
              </button>
              {numFighters < 2 && (
                <p className="mt-4 text-sm text-gray-500">Need at least 2 checked-in fighters</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Bracket Selector */}
            <div className="mb-6 flex gap-4 items-center">
              {brackets.length > 1 && (
                <div className="flex gap-2">
                  {brackets.map((bracket) => (
                    <button
                      key={bracket.id}
                      onClick={() => setSelectedBracket(bracket)}
                      className={`px-6 py-3 rounded-lg font-heading font-bold transition ${
                        selectedBracket?.id === bracket.id
                          ? 'bg-mbjj-red text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {bracket.format_type.replace(/_/g, ' ')}
                      {bracket.weight_class_id && ' (Weight Class)'}
                    </button>
                  ))}
                </div>
              )}

              {/* Visualization Link */}
              <a
                href={`/events/${eventId}/brackets/visualization`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg font-heading font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-2"
              >
                📺 BROADCAST VIEW
              </a>
            </div>

            {/* Bracket Tree Visualization */}
            {rounds.length > 0 ? (
              <BracketTree
                rounds={rounds}
                matches={matches}
                players={players}
                onMatchClick={handleMatchClick}
              />
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p className="text-xl font-heading">No rounds generated yet</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Match Modal */}
      {selectedMatchId && (
        <MatchModal
          matchId={selectedMatchId}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onResultSubmitted={handleResultSubmitted}
        />
      )}
    </div>
  );
}
