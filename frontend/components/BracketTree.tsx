'use client';

import { useState } from 'react';

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
}

interface BracketRound {
  id: number;
  round_number: number;
  round_name: string | null;
  bracket_type: string | null;
  status: string;
}

interface BracketTreeProps {
  rounds: BracketRound[];
  matches: Match[];
  players: Record<number, Player>;
  onMatchClick: (matchId: number) => void;
}

export default function BracketTree({ rounds, matches, players, onMatchClick }: BracketTreeProps) {
  // Sort rounds by round_number
  const sortedRounds = [...rounds].sort((a, b) => a.round_number - b.round_number);

  const getPlayerName = (playerId: number | null): string => {
    if (!playerId) return 'TBD';
    return players[playerId]?.name || 'Unknown';
  };

  const getMatchStatusColor = (match: Match): string => {
    if (match.result) return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    if (match.match_status === 'ready') return 'border-mbjj-red bg-red-50 dark:bg-red-900/20';
    if (match.match_status === 'in_progress') return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    return 'border-gray-300 bg-white dark:bg-gray-800';
  };

  const getWinnerHighlight = (match: Match, isPlayerA: boolean): string => {
    if (!match.result) return '';

    const isWinner = (match.result === 'a_win' && isPlayerA) || (match.result === 'b_win' && !isPlayerA);
    return isWinner ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-500 line-through';
  };

  return (
    <div className="overflow-x-auto pb-8">
      <div className="inline-flex gap-8 min-w-full">
        {sortedRounds.map((round) => {
          // Filter matches that belong to this round using bracket_round_id
          const roundMatches = matches
            .filter(m => m.bracket_round_id === round.id)
            .sort((a, b) => (a.match_number || 0) - (b.match_number || 0));

          return (
            <div key={round.id} className="flex flex-col min-w-[300px]">
              {/* Round Header */}
              <div className="mb-4 sticky top-0 bg-white dark:bg-mbjj-dark z-10 pb-2">
                <h3 className="text-xl font-heading font-bold text-center">
                  {round.round_name || `Round ${round.round_number}`}
                </h3>
                {round.bracket_type && (
                  <div className="text-sm text-gray-500 text-center capitalize">
                    {round.bracket_type.replace('_', ' ')}
                  </div>
                )}
              </div>

              {/* Matches in this round */}
              <div className="flex flex-col justify-around gap-6 flex-1">
                {roundMatches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => onMatchClick(match.id)}
                    className={`
                      ${getMatchStatusColor(match)}
                      border-2 rounded-lg p-4
                      hover:shadow-lg hover:scale-105
                      transition-all duration-200
                      cursor-pointer text-left
                      relative
                    `}
                  >
                    {/* Match Number Badge */}
                    {match.match_number && (
                      <div className="absolute -top-3 -right-3 bg-mbjj-red text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {match.match_number}
                      </div>
                    )}

                    {/* Player A */}
                    <div className={`mb-2 ${getWinnerHighlight(match, true)}`}>
                      <div className="text-lg font-heading">
                        {getPlayerName(match.a_player_id)}
                      </div>
                    </div>

                    {/* VS or Result */}
                    <div className="text-center text-sm text-gray-500 my-1">
                      {match.result ? (
                        <>
                          {match.method && (
                            <div className="font-semibold text-green-600">
                              {match.method}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="font-heading text-gray-400">VS</div>
                      )}
                    </div>

                    {/* Player B */}
                    <div className={`${getWinnerHighlight(match, false)}`}>
                      <div className="text-lg font-heading">
                        {getPlayerName(match.b_player_id)}
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="mt-2 text-xs text-center">
                      {match.result && (
                        <span className="text-green-600 font-semibold">✓ Complete</span>
                      )}
                      {!match.result && match.match_status === 'ready' && (
                        <span className="text-mbjj-red font-semibold">⚡ Ready</span>
                      )}
                      {!match.result && match.match_status === 'pending' && (
                        <span className="text-gray-500">⏳ Pending</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
