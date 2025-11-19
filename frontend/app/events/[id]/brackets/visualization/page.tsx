'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { config } from '@/lib/config';

interface Player {
  id: number;
  name: string;
}

interface Match {
  id: number;
  match_number: number;
  a_player_id: number | null;
  b_player_id: number | null;
  player_a?: Player;
  player_b?: Player;
  result: string | null;
  method: string | null;
  duration_seconds: number | null;
  match_status: string;
}

interface Round {
  id: number;
  round_number: number;
  round_name: string;
  bracket_type: string | null;
  status: string;
  matches: Match[];
}

interface BracketFormat {
  id: number;
  format_type: string;
  rounds: Round[];
}

export default function BracketVisualization() {
  const params = useParams();
  const eventId = params?.id;
  const [brackets, setBrackets] = useState<BracketFormat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBrackets = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/events/${eventId}/brackets`);
      if (res.ok) {
        const data = await res.json();
        setBrackets(data);
      }
    } catch (error) {
      console.error('Failed to load brackets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadBrackets();
    }
  }, [eventId]);

  const deleteBracket = async (bracketId: number, formatType: string) => {
    if (!confirm(`Are you sure you want to delete this ${formatType.replace('_', ' ')} bracket? This will delete all associated rounds and matches. This cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${config.apiUrl}/api/tournaments/brackets/${bracketId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to delete bracket');
      }

      const result = await res.json();
      alert(`Successfully deleted bracket:\n- ${result.deleted_matches} matches\n- ${result.deleted_rounds} rounds${result.elo_recalculated ? '\n- ELO ratings recalculated' : ''}`);

      await loadBrackets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const getWinnerName = (match: Match) => {
    if (!match.result) return null;

    const result = match.result.toUpperCase();
    if (result === 'PLAYER_A_WIN' || result === 'A_WIN') {
      return match.player_a?.name || 'Player A';
    } else if (result === 'PLAYER_B_WIN' || result === 'B_WIN') {
      return match.player_b?.name || 'Player B';
    }
    return null;
  };

  const renderMatch = (match: Match, showDetails: boolean = true) => {
    const winner = getWinnerName(match);
    const playerA = match.player_a?.name || 'TBD';
    const playerB = match.player_b?.name || (match.method === 'Bye' ? 'BYE' : 'TBD');

    const resultUpper = match.result?.toUpperCase();
    const isPlayerAWinner = resultUpper === 'PLAYER_A_WIN' || resultUpper === 'A_WIN';
    const isPlayerBWinner = resultUpper === 'PLAYER_B_WIN' || resultUpper === 'B_WIN';
    const isCompleted = match.match_status === 'completed';

    return (
      <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 min-w-[280px]">
        <div className="text-xs text-neutral-400 mb-2">Match {match.match_number}</div>

        {/* Player A */}
        <div className={`flex items-center justify-between mb-2 p-2 rounded ${
          isPlayerAWinner ? 'bg-green-900/30 border border-green-700' :
          isCompleted && !isPlayerAWinner ? 'bg-red-900/20 border border-red-900/30' :
          'bg-neutral-700/50'
        }`}>
          <span className={`${isPlayerAWinner ? 'font-bold text-white' : 'text-neutral-300'}`}>
            {playerA}
          </span>
          {isPlayerAWinner && <span className="text-green-400">✓</span>}
          {isCompleted && !isPlayerAWinner && !isPlayerBWinner && <span className="text-neutral-500">✗</span>}
        </div>

        {/* VS divider */}
        <div className="text-center text-xs text-neutral-500 my-1">vs</div>

        {/* Player B */}
        <div className={`flex items-center justify-between p-2 rounded ${
          isPlayerBWinner ? 'bg-green-900/30 border border-green-700' :
          isCompleted && !isPlayerBWinner ? 'bg-red-900/20 border border-red-900/30' :
          'bg-neutral-700/50'
        }`}>
          <span className={`${isPlayerBWinner ? 'font-bold text-white' : 'text-neutral-300'}`}>
            {playerB}
          </span>
          {isPlayerBWinner && <span className="text-green-400">✓</span>}
          {isCompleted && !isPlayerBWinner && !isPlayerAWinner && playerB !== 'BYE' && <span className="text-neutral-500">✗</span>}
        </div>

        {/* Match details */}
        {showDetails && isCompleted && match.method && match.method !== 'Bye' && (
          <div className="mt-3 pt-3 border-t border-neutral-700">
            <div className="text-xs text-neutral-400">
              <div className="font-semibold text-white mb-1">{winner} wins</div>
              <div>{match.method}</div>
              {match.duration_seconds !== null && match.duration_seconds > 0 && (
                <div>{Math.floor(match.duration_seconds / 60)}:{(match.duration_seconds % 60).toString().padStart(2, '0')}</div>
              )}
            </div>
          </div>
        )}

        {match.method === 'Bye' && (
          <div className="mt-2 text-xs text-center text-neutral-500">
            (Bye - Advances)
          </div>
        )}
      </div>
    );
  };

  const renderDoubleEliminationBracket = (bracket: BracketFormat) => {
    const winnersRounds = bracket.rounds.filter(r => r.bracket_type === 'winners' || r.bracket_type === null).sort((a, b) => a.round_number - b.round_number);
    const losersRounds = bracket.rounds.filter(r => r.bracket_type === 'losers').sort((a, b) => a.round_number - b.round_number);
    const finalsRounds = bracket.rounds.filter(r => r.bracket_type === 'finals');

    return (
      <div className="space-y-8">
        {/* Winners Bracket */}
        <div>
          <h2 className="text-2xl font-heading uppercase text-red-500 mb-4">Winners Bracket</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {winnersRounds.map((round) => (
              <div key={round.id} className="flex flex-col gap-4 min-w-[300px]">
                <div className="sticky top-0 bg-neutral-900 py-2 z-10">
                  <h3 className="text-lg font-heading uppercase text-white">{round.round_name}</h3>
                  <div className="text-xs text-neutral-400">{round.status}</div>
                </div>
                <div className="space-y-4">
                  {round.matches.map((match) => renderMatch(match))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Losers Bracket */}
        {losersRounds.length > 0 && (
          <div className="border-t border-neutral-700 pt-8">
            <h2 className="text-2xl font-heading uppercase text-blue-500 mb-4">Losers Bracket</h2>
            <div className="flex gap-6 overflow-x-auto pb-4">
              {losersRounds.map((round) => (
                <div key={round.id} className="flex flex-col gap-4 min-w-[300px]">
                  <div className="sticky top-0 bg-neutral-900 py-2 z-10">
                    <h3 className="text-lg font-heading uppercase text-white">{round.round_name}</h3>
                    <div className="text-xs text-neutral-400">{round.status}</div>
                  </div>
                  <div className="space-y-4">
                    {round.matches.map((match) => renderMatch(match))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grand Finals */}
        {finalsRounds.length > 0 && (
          <div className="border-t border-neutral-700 pt-8">
            <h2 className="text-2xl font-heading uppercase text-yellow-500 mb-4">Grand Finals</h2>
            <div className="flex justify-center">
              {finalsRounds.map((round) => (
                <div key={round.id} className="flex flex-col gap-4">
                  <div className="space-y-4">
                    {round.matches.map((match) => renderMatch(match))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSingleEliminationBracket = (bracket: BracketFormat) => {
    const rounds = bracket.rounds.sort((a, b) => a.round_number - b.round_number);

    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {rounds.map((round) => (
          <div key={round.id} className="flex flex-col gap-4 min-w-[300px]">
            <div className="sticky top-0 bg-neutral-900 py-2 z-10">
              <h3 className="text-lg font-heading uppercase text-white">{round.round_name}</h3>
              <div className="text-xs text-neutral-400">{round.status}</div>
            </div>
            <div className="space-y-4">
              {round.matches.map((match) => renderMatch(match))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRoundRobinBracket = (bracket: BracketFormat) => {
    const rounds = bracket.rounds.sort((a, b) => a.round_number - b.round_number);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {rounds.map((round) => (
          <div key={round.id} className="bg-neutral-800 rounded-lg p-6">
            <h3 className="text-lg font-heading uppercase text-white mb-4">{round.round_name}</h3>
            <div className="text-xs text-neutral-400 mb-4">{round.status}</div>
            <div className="space-y-4">
              {round.matches.map((match) => renderMatch(match, false))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBracket = (bracket: BracketFormat) => {
    switch (bracket.format_type) {
      case 'double_elimination':
        return renderDoubleEliminationBracket(bracket);
      case 'single_elimination':
        return renderSingleEliminationBracket(bracket);
      case 'round_robin':
        return renderRoundRobinBracket(bracket);
      case 'swiss':
      case 'guaranteed_matches':
        return renderSingleEliminationBracket(bracket); // Similar layout
      default:
        return <div>Unsupported bracket format: {bracket.format_type}</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white p-8">
        <div className="text-center">Loading bracket...</div>
      </div>
    );
  }

  if (brackets.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white p-8">
        <div className="text-center text-neutral-400">No brackets found for this event</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8">
      <div className="max-w-[1920px] mx-auto">
        <h1 className="text-4xl font-heading uppercase mb-8">Bracket Visualization</h1>

        {brackets.map((bracket) => (
          <div key={bracket.id} className="mb-12">
            <div className="mb-6 flex justify-between items-center">
              <span className="text-sm text-neutral-400 uppercase tracking-wide">
                {bracket.format_type.replace('_', ' ')}
              </span>
              <button
                onClick={() => deleteBracket(bracket.id, bracket.format_type)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold text-sm"
                disabled={loading}
              >
                Delete Bracket
              </button>
            </div>
            {renderBracket(bracket)}
          </div>
        ))}
      </div>
    </div>
  );
}
