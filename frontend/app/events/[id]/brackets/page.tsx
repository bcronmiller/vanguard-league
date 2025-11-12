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
  const [format, setFormat] = useState<'single_elimination' | 'double_elimination' | 'swiss' | 'round_robin' | 'guaranteed_matches'>('single_elimination');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  // Redirect if in read-only mode
  useEffect(() => {
    if (config.readOnly) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    loadBrackets();
    loadPlayers();
  }, [eventId]);

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
    if (!confirm(`Generate ${format.replace(/_/g, ' ')} bracket? This will create match pairings.`)) return;

    setGenerating(true);
    try {
      // Step 1: Create bracket
      const createRes = await fetch(`${config.apiUrl}/api/tournaments/brackets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: parseInt(eventId),
          weight_class_id: null, // null = all fighters
          format_type: format,
          config: {},
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
            <h2 className="text-3xl font-heading font-bold mb-6">NO BRACKETS YET</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Select a bracket format and generate pairings
            </p>

            <div className="max-w-md mx-auto space-y-4 mb-8">
              <button
                onClick={() => setFormat('round_robin')}
                className={`w-full p-4 rounded-lg border-2 font-heading font-bold text-lg transition ${
                  format === 'round_robin'
                    ? 'border-mbjj-red bg-mbjj-red text-white'
                    : 'border-gray-300 hover:border-mbjj-red'
                }`}
              >
                ROUND ROBIN
                <div className="text-sm font-normal">Everyone fights everyone (best for small groups)</div>
              </button>

              <button
                onClick={() => setFormat('single_elimination')}
                className={`w-full p-4 rounded-lg border-2 font-heading font-bold text-lg transition ${
                  format === 'single_elimination'
                    ? 'border-mbjj-red bg-mbjj-red text-white'
                    : 'border-gray-300 hover:border-mbjj-red'
                }`}
              >
                SINGLE ELIMINATION
                <div className="text-sm font-normal">One loss and you're out (tournament style)</div>
              </button>

              <button
                onClick={() => setFormat('double_elimination')}
                className={`w-full p-4 rounded-lg border-2 font-heading font-bold text-lg transition ${
                  format === 'double_elimination'
                    ? 'border-mbjj-red bg-mbjj-red text-white'
                    : 'border-gray-300 hover:border-mbjj-red'
                }`}
              >
                DOUBLE ELIMINATION
                <div className="text-sm font-normal">Two losses to be eliminated</div>
              </button>

              <button
                onClick={() => setFormat('swiss')}
                className={`w-full p-4 rounded-lg border-2 font-heading font-bold text-lg transition ${
                  format === 'swiss'
                    ? 'border-mbjj-red bg-mbjj-red text-white'
                    : 'border-gray-300 hover:border-mbjj-red'
                }`}
              >
                SWISS SYSTEM
                <div className="text-sm font-normal">Record-based pairing (advanced tournaments)</div>
              </button>
            </div>

            <button
              onClick={createAndGenerateBracket}
              disabled={generating}
              className="px-12 py-4 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-2xl rounded-lg transition disabled:opacity-50"
            >
              {generating ? 'GENERATING...' : 'GENERATE BRACKETS'}
            </button>
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
