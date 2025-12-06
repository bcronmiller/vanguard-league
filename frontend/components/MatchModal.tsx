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

// Sponsors data
const SPONSORS = [
  {
    name: 'Neff Bros. Stone',
    logo: 'https://neffbrothersstone.com/wp-content/uploads/2022/12/cropped-NeffBROSlogo.png',
  },
  {
    name: 'Leadmark Contracting',
    logo: 'https://leadmk.com/wp-content/uploads/2025/04/image-5-removebg-preview.png',
  },
  {
    name: 'Precision Lawn & Landscape',
    logo: 'https://precisionlawnandlandscape.com/wp-content/uploads/2023/12/logo.webp',
  },
  {
    name: 'Game Day Men\'s Health',
    logo: 'https://i.imgur.com/TqHjlU1.png',
  },
  {
    name: 'Attn2DetailMercantile',
    logo: 'https://attn2detailmercantile.com/cdn/shop/files/Red_Knife_Girl_213x150.png?v=1702409843',
  },
  {
    name: 'Halse Remodeling',
    logo: 'https://i.imgur.com/hTMFjyj.png',
  },
];

export default function MatchModal({ matchId, isOpen, onClose, onResultSubmitted }: MatchModalProps) {
  const [taleData, setTaleData] = useState<TaleOfTheTape | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [selectedResult, setSelectedResult] = useState<'a_win' | 'b_win' | 'draw' | null>(null);

  // Distribute sponsors evenly based on match ID
  const sponsor = SPONSORS[matchId % SPONSORS.length];

  useEffect(() => {
    if (isOpen && matchId) {
      loadTaleOfTheTape();
    }
  }, [isOpen, matchId]);

  const loadTaleOfTheTape = async () => {
    setLoading(true);
    setTaleData(null); // Clear old data first
    try {
      const res = await fetch(`${config.apiUrl}/api/tournaments/matches/${matchId}/tale-of-the-tape`);
      if (res.ok) {
        const data = await res.json();
        setTaleData(data);
      } else {
        // Match has TBD players or other error - keep taleData as null
        console.log('Match not ready yet (TBD players)');
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
      // Calculate total duration in seconds from minutes and seconds
      let totalSeconds = null;
      if (durationMinutes || durationSeconds) {
        const mins = parseInt(durationMinutes) || 0;
        const secs = parseInt(durationSeconds) || 0;
        totalSeconds = (mins * 60) + secs;
      }

      const res = await fetch(`${config.apiUrl}/api/tournaments/matches/${matchId}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: selectedResult,
          method: method || null,
          duration_seconds: totalSeconds,
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

  const undoResult = async () => {
    if (!confirm('Are you sure you want to undo this match result? This will recalculate all ELO ratings.')) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${config.apiUrl}/api/tournaments/matches/${matchId}/result`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Match result undone successfully');
        onResultSubmitted();
        onClose();
      } else {
        const error = await res.json();
        alert(`Failed to undo result: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to undo result:', error);
      alert('Error undoing result');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMatch = async () => {
    if (!confirm('Are you sure you want to delete this match entirely? This will remove the pairing and cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${config.apiUrl}/api/tournaments/matches/${matchId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Match deleted successfully');
        onResultSubmitted();
        onClose();
      } else {
        const error = await res.json();
        alert(`Failed to delete match: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete match:', error);
      alert('Error deleting match');
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
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md">
          <div className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">Match Not Ready</div>
          <div className="text-gray-700 dark:text-gray-300 mb-6">
            This match cannot be started yet because one or both fighters are TBD (To Be Determined).
            <br/><br/>
            Complete the previous round's matches first, and the winners will automatically advance to this match.
          </div>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold rounded-lg transition"
          >
            CLOSE
          </button>
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

  // Convert win probability to American odds
  const getAmericanOdds = (winProbability: number): string => {
    const prob = winProbability / 100; // Convert percentage to decimal

    if (prob >= 0.50) {
      // Favorite (negative odds)
      const odds = -100 * (prob / (1 - prob));
      return Math.round(odds).toString();
    } else {
      // Underdog (positive odds)
      const odds = 100 * ((1 - prob) / prob);
      return '+' + Math.round(odds).toString();
    }
  };

  const player_a_odds = getAmericanOdds(elo_preview.player_a.expected_score);
  const player_b_odds = getAmericanOdds(elo_preview.player_b.expected_score);
  const player_a_favorite = elo_preview.player_a.expected_score > elo_preview.player_b.expected_score;

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

          <div className="mt-4">
            <button
              onClick={() => window.open(`/tape/${matchId}`, '_blank', 'noopener,noreferrer')}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-heading font-bold rounded-lg transition"
            >
              Open Chroma Overlay
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Fighter Comparison */}
          <div className="grid grid-cols-3 gap-8 mb-8">
            {/* Player A */}
            <div className="text-right">
              {/* Fighter Photo */}
              <div className="flex justify-end mb-4">
                {player_a.photo_url ? (
                  <img
                    src={player_a.photo_url}
                    alt={player_a.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-mbjj-red shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-600 border-4 border-mbjj-red shadow-lg flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
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
              {/* Sponsor */}
              <div className="mb-6 text-center">
                <div className="text-xs text-gray-500 mb-2">SPONSORED BY</div>
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="h-16 w-auto mx-auto object-contain mb-1"
                />
                <div className="text-xs font-heading text-gray-600 dark:text-gray-400">
                  {sponsor.name}
                </div>
              </div>

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
              {/* Fighter Photo */}
              <div className="flex justify-start mb-4">
                {player_b.photo_url ? (
                  <img
                    src={player_b.photo_url}
                    alt={player_b.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-mbjj-blue shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-600 border-4 border-mbjj-blue shadow-lg flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
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

          {/* Previous Matches History */}
          {head_to_head.recent_matches && head_to_head.recent_matches.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-heading font-bold mb-4">PREVIOUS MATCHES</h3>
              <div className="space-y-3">
                {head_to_head.recent_matches.map((match: any, index: number) => {
                  // Check result field first, then fall back to winner_id
                  let isDraw = false;
                  let isPlayerAWinner = false;
                  let isPlayerBWinner = false;

                  if (match.result) {
                    // Use result field if available (player_a_win, player_b_win, draw)
                    isDraw = match.result === 'draw';
                    isPlayerAWinner = match.result === 'player_a_win';
                    isPlayerBWinner = match.result === 'player_b_win';
                  } else if (match.winner_id) {
                    // Fall back to winner_id
                    isPlayerAWinner = match.winner_id === player_a.id;
                    isPlayerBWinner = match.winner_id === player_b.id;
                  } else {
                    isDraw = true;
                  }

                  return (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-gray-300">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-bold">
                            {isDraw ? (
                              <span className="text-yellow-600">DRAW</span>
                            ) : (
                              <span className={isPlayerAWinner ? 'text-green-600' : 'text-red-600'}>
                                {isPlayerAWinner ? `${player_a.name} WON` : `${player_b.name} WON`}
                              </span>
                            )}
                          </div>
                          {match.method && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Method: {match.method}
                            </div>
                          )}
                          {match.duration_seconds && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Time: {Math.floor(match.duration_seconds / 60)}:{(match.duration_seconds % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {match.event_name && (
                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                              {match.event_name}
                            </div>
                          )}
                          {match.round_name && (
                            <div className="text-xs text-gray-500">
                              {match.round_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ELO Prediction */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-heading font-bold mb-4">ELO IMPACT - ALL OUTCOMES</h3>

            {/* Betting Odds */}
            <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-gray-300 dark:border-gray-600">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Betting Odds</div>
                <div className={`text-3xl font-heading font-bold ${player_a_favorite ? 'text-green-600' : 'text-red-600'}`}>
                  {player_a_odds}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {elo_preview.player_a.expected_score}% win probability
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Betting Odds</div>
                <div className={`text-3xl font-heading font-bold ${player_a_favorite ? 'text-red-600' : 'text-green-600'}`}>
                  {player_b_odds}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {elo_preview.player_b.expected_score}% win probability
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

          {/* Result Selection or Match Completed */}
          {taleData.match_status === 'COMPLETED' ? (
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-6">
              <h3 className="text-xl font-heading font-bold mb-4 text-green-600 dark:text-green-400">
                ✓ MATCH COMPLETED
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This match result has been recorded. ELO ratings have been updated.
              </p>
              <div className="space-y-3">
                <button
                  onClick={undoResult}
                  disabled={submitting}
                  className="w-full py-4 bg-yellow-600 hover:bg-yellow-700 text-white font-heading font-bold text-xl rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'UNDOING...' : 'UNDO RESULT'}
                </button>
                <button
                  onClick={deleteMatch}
                  disabled={submitting}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-heading font-bold text-lg rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'DELETING...' : 'DELETE MATCH'}
                </button>
              </div>
            </div>
          ) : (
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
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Method (Optional)</label>
                <input
                  type="text"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  placeholder="e.g., Rear Naked Choke"
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-mbjj-red focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Minutes</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-mbjj-red focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Seconds</label>
                  <input
                    type="number"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="59"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-mbjj-red focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={submitResult}
                disabled={!selectedResult || submitting}
                className="w-full py-4 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-2xl rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {submitting ? 'SUBMITTING...' : 'SUBMIT RESULT'}
              </button>

              {/* Delete Match Option */}
              <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Need to remove this pairing? (e.g., for a late entry)
                </p>
                <button
                  onClick={deleteMatch}
                  disabled={submitting}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-heading font-bold text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'DELETING...' : 'DELETE MATCH'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
