'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface Player {
  id: number;
  name: string;
  photo_url: string | null;
  bjj_belt_rank: string | null;
  weight: number | null;
  academy: string | null;
  elo_rating: number | null;
  wins: number;
  losses: number;
  draws: number;
  win_streak: number;
}

interface EloPreview {
  player_a: {
    id: number;
    name: string;
    current_elo: number;
    matches_played: number;
    expected_score: number;
  };
  player_b: {
    id: number;
    name: string;
    current_elo: number;
    matches_played: number;
    expected_score: number;
  };
  outcomes: {
    player_a_wins: {
      player_a_change: number;
      player_b_change: number;
      player_a_new_elo: number;
      player_b_new_elo: number;
    };
    player_b_wins: {
      player_a_change: number;
      player_b_change: number;
      player_a_new_elo: number;
      player_b_new_elo: number;
    };
    draw: {
      player_a_change: number;
      player_b_change: number;
      player_a_new_elo: number;
      player_b_new_elo: number;
    };
  };
}

interface HeadToHead {
  total_matches: number;
  player_a_wins: number;
  player_b_wins: number;
  draws: number;
  recent_matches: any[];
}

interface TaleOfTheTape {
  match_id: number;
  match_status: string;
  round_name: string | null;
  player_a: Player;
  player_b: Player;
  head_to_head: HeadToHead;
  elo_preview: EloPreview;
}

interface MatchModalProps {
  matchId: number;
  isOpen: boolean;
  onClose: () => void;
  onResultSubmitted: () => void;
}

export default function MatchModal({ matchId, isOpen, onClose, onResultSubmitted }: MatchModalProps) {
  const [taleData, setTaleData] = useState<TaleOfTheTape | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedResult, setSelectedResult] = useState<'a_win' | 'b_win' | 'draw' | null>(null);

  useEffect(() => {
    if (isOpen && matchId) {
      loadTaleOfTheTape();
    }
  }, [isOpen, matchId]);

  const loadTaleOfTheTape = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.apiUrl}/api/tournaments/matches/${matchId}/tale-of-the-tape`);
      if (res.ok) {
        const data = await res.json();
        setTaleData(data);
      }
    } catch (error) {
      console.error('Failed to load tale of the tape:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitResult = async () => {
    if (!selectedResult) return;

    setSubmitting(true);
    try {
      const durationSeconds = duration ? parseInt(duration) * 60 : null;

      const res = await fetch(`${config.apiUrl}/api/tournaments/matches/${matchId}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: selectedResult,
          method: method || null,
          duration_seconds: durationSeconds,
        }),
      });

      if (res.ok) {
        onResultSubmitted();
        onClose();
      } else {
        alert('Failed to submit result');
      }
    } catch (error) {
      console.error('Failed to submit result:', error);
      alert('Error submitting result');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="text-2xl font-heading text-gray-600 dark:text-gray-400">LOADING...</div>
        </div>
      </div>
    );
  }

  if (!taleData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="text-xl text-red-600">Failed to load match data</div>
          <button onClick={onClose} className="mt-4 px-6 py-2 bg-gray-300 rounded-lg">Close</button>
        </div>
      </div>
    );
  }

  const { player_a, player_b, head_to_head, elo_preview, round_name } = taleData;

  const getEloImpact = () => {
    if (selectedResult === 'a_win') return elo_preview.outcomes.player_a_wins;
    if (selectedResult === 'b_win') return elo_preview.outcomes.player_b_wins;
    if (selectedResult === 'draw') return elo_preview.outcomes.draw;
    return null;
  };

  const eloImpact = getEloImpact();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="bg-mbjj-dark text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-heading font-bold">TALE OF THE TAPE</h2>
              {round_name && <p className="text-gray-300 mt-1">{round_name}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-3xl hover:text-mbjj-red transition"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Fighter Comparison */}
          <div className="grid grid-cols-3 gap-8 mb-8">
            {/* Player A */}
            <div className="text-right">
              <div className="text-2xl font-heading font-bold mb-2">{player_a.name}</div>
              {player_a.academy && <div className="text-sm text-gray-600 mb-4">{player_a.academy}</div>}

              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Belt Rank</div>
                  <div className="font-bold">{player_a.bjj_belt_rank || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Weight</div>
                  <div className="font-bold">{player_a.weight ? `${player_a.weight} lbs` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Record</div>
                  <div className="font-bold">{player_a.wins}-{player_a.losses}-{player_a.draws}</div>
                </div>
                {player_a.win_streak > 0 && (
                  <div>
                    <div className="text-xs text-gray-500">Win Streak</div>
                    <div className="font-bold text-green-600">🔥 {player_a.win_streak}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500">ELO Rating</div>
                  <div className="font-bold">{Math.round(player_a.elo_rating || 0)}</div>
                </div>
              </div>
            </div>

            {/* VS / Head to Head */}
            <div className="flex flex-col items-center justify-center border-x-2 border-gray-200">
              <div className="text-5xl font-heading text-gray-400 mb-4">VS</div>

              {head_to_head.total_matches > 0 && (
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 w-full text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Previous Fights</div>
                  <div className="text-2xl font-heading font-bold">
                    {head_to_head.player_a_wins} - {head_to_head.player_b_wins}
                    {head_to_head.draws > 0 && ` - ${head_to_head.draws}`}
                  </div>
                </div>
              )}

              {head_to_head.total_matches === 0 && (
                <div className="text-sm text-gray-500">First Meeting</div>
              )}
            </div>

            {/* Player B */}
            <div className="text-left">
              <div className="text-2xl font-heading font-bold mb-2">{player_b.name}</div>
              {player_b.academy && <div className="text-sm text-gray-600 mb-4">{player_b.academy}</div>}

              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Belt Rank</div>
                  <div className="font-bold">{player_b.bjj_belt_rank || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Weight</div>
                  <div className="font-bold">{player_b.weight ? `${player_b.weight} lbs` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Record</div>
                  <div className="font-bold">{player_b.wins}-{player_b.losses}-{player_b.draws}</div>
                </div>
                {player_b.win_streak > 0 && (
                  <div>
                    <div className="text-xs text-gray-500">Win Streak</div>
                    <div className="font-bold text-green-600">🔥 {player_b.win_streak}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500">ELO Rating</div>
                  <div className="font-bold">{Math.round(player_b.elo_rating || 0)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ELO Prediction */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-heading font-bold mb-4">ELO IMPACT - ALL OUTCOMES</h3>

            {/* Win Probabilities */}
            <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-gray-300 dark:border-gray-600">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Win Probability</div>
                <div className="text-3xl font-heading font-bold text-mbjj-red">
                  {elo_preview.player_a.expected_score}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Win Probability</div>
                <div className="text-3xl font-heading font-bold text-mbjj-red">
                  {elo_preview.player_b.expected_score}%
                </div>
              </div>
            </div>

            {/* All Three Outcomes */}
            <div className="space-y-4">
              {/* Player A Wins */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-transparent hover:border-green-500 transition">
                <div className="text-sm font-bold text-green-600 mb-2">IF {player_a.name.toUpperCase()} WINS:</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">{player_a.name}</div>
                    <div className="text-2xl font-heading text-green-600">
                      +{elo_preview.outcomes.player_a_wins.player_a_change}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player_a.elo_rating?.toFixed(0)} → {elo_preview.outcomes.player_a_wins.player_a_new_elo}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">{player_b.name}</div>
                    <div className="text-2xl font-heading text-red-600">
                      {elo_preview.outcomes.player_a_wins.player_b_change}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player_b.elo_rating?.toFixed(0)} → {elo_preview.outcomes.player_a_wins.player_b_new_elo}
                    </div>
                  </div>
                </div>
              </div>

              {/* Player B Wins */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-transparent hover:border-green-500 transition">
                <div className="text-sm font-bold text-green-600 mb-2">IF {player_b.name.toUpperCase()} WINS:</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">{player_a.name}</div>
                    <div className="text-2xl font-heading text-red-600">
                      {elo_preview.outcomes.player_b_wins.player_a_change}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player_a.elo_rating?.toFixed(0)} → {elo_preview.outcomes.player_b_wins.player_a_new_elo}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">{player_b.name}</div>
                    <div className="text-2xl font-heading text-green-600">
                      +{elo_preview.outcomes.player_b_wins.player_b_change}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player_b.elo_rating?.toFixed(0)} → {elo_preview.outcomes.player_b_wins.player_b_new_elo}
                    </div>
                  </div>
                </div>
              </div>

              {/* Draw */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-transparent hover:border-gray-500 transition">
                <div className="text-sm font-bold text-gray-600 mb-2">IF DRAW:</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">{player_a.name}</div>
                    <div className={`text-2xl font-heading ${elo_preview.outcomes.draw.player_a_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {elo_preview.outcomes.draw.player_a_change > 0 ? '+' : ''}{elo_preview.outcomes.draw.player_a_change}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player_a.elo_rating?.toFixed(0)} → {elo_preview.outcomes.draw.player_a_new_elo}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">{player_b.name}</div>
                    <div className={`text-2xl font-heading ${elo_preview.outcomes.draw.player_b_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {elo_preview.outcomes.draw.player_b_change > 0 ? '+' : ''}{elo_preview.outcomes.draw.player_b_change}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player_b.elo_rating?.toFixed(0)} → {elo_preview.outcomes.draw.player_b_new_elo}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Result Selection */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-heading font-bold mb-4">RECORD RESULT</h3>

            {/* Winner Buttons */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <button
                onClick={() => setSelectedResult('a_win')}
                className={`p-4 rounded-lg font-heading font-bold text-lg border-2 transition ${
                  selectedResult === 'a_win'
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 hover:border-green-500'
                }`}
              >
                {player_a.name} WINS
              </button>

              <button
                onClick={() => setSelectedResult('draw')}
                className={`p-4 rounded-lg font-heading font-bold text-lg border-2 transition ${
                  selectedResult === 'draw'
                    ? 'border-yellow-500 bg-yellow-500 text-white'
                    : 'border-gray-300 hover:border-yellow-500'
                }`}
              >
                DRAW
              </button>

              <button
                onClick={() => setSelectedResult('b_win')}
                className={`p-4 rounded-lg font-heading font-bold text-lg border-2 transition ${
                  selectedResult === 'b_win'
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 hover:border-green-500'
                }`}
              >
                {player_b.name} WINS
              </button>
            </div>

            {/* Method and Duration */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold mb-2">Method (Optional)</label>
                <input
                  type="text"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  placeholder="e.g., Rear Naked Choke"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-mbjj-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Duration (Minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 3"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-mbjj-red focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={submitResult}
              disabled={!selectedResult || submitting}
              className="w-full py-4 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-2xl rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'SUBMITTING...' : 'SUBMIT RESULT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
