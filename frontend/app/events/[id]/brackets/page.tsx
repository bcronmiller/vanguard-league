'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';

interface Match {
  id: number;
  match_number: number;
  player_a: { id: number; name: string; photo_url: string | null } | null;
  player_b: { id: number; name: string; photo_url: string | null } | null;
  result: string | null;
  method: string | null;
  duration_seconds: number | null;
  synced_to_rankade: boolean;
}

export default function BracketsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState<'single_elimination' | 'double_elimination' | 'swiss'>('swiss');

  // Redirect if in read-only mode
  useEffect(() => {
    if (config.readOnly) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    loadMatches();
  }, [eventId]);

  const loadMatches = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/events/${eventId}/matches`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBrackets = async () => {
    if (!confirm(`Generate ${format.replace('_', ' ')} brackets? This will create match pairings.`)) return;

    setGenerating(true);
    try {
      const res = await fetch(`${config.apiUrl}/api/events/${eventId}/generate-brackets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });

      if (res.ok) {
        await loadMatches();
        alert('Brackets generated successfully!');
      } else {
        const error = await res.json();
        alert(`Failed to generate brackets: ${error.detail}`);
      }
    } catch (error) {
      console.error('Bracket generation error:', error);
      alert('Failed to generate brackets');
    } finally {
      setGenerating(false);
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
                onClick={() => setFormat('swiss')}
                className={`w-full p-4 rounded-lg border-2 font-heading font-bold text-lg transition ${
                  format === 'swiss'
                    ? 'border-mbjj-red bg-mbjj-red text-white'
                    : 'border-gray-300 hover:border-mbjj-red'
                }`}
              >
                SWISS / ROUND ROBIN
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
            </div>

            <button
              onClick={generateBrackets}
              disabled={generating}
              className="px-12 py-4 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-2xl rounded-lg transition disabled:opacity-50"
            >
              {generating ? 'GENERATING...' : 'GENERATE BRACKETS'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className={`bg-white dark:bg-gray-800 rounded-lg p-6 border-l-4 ${
                  match.result ? 'border-green-500' : 'border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-2xl font-heading font-bold text-gray-500 w-16">
                    #{match.match_number}
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                    <div className={`text-right ${match.result === 'a_win' ? 'text-green-600 font-bold' : ''}`}>
                      <div className="text-xl font-heading">{match.player_a?.name || 'TBD'}</div>
                    </div>

                    <div className="text-center">
                      {match.result ? (
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-green-600">✓ COMPLETE</div>
                          {match.method && <div className="text-sm text-gray-600">{match.method}</div>}
                          {match.duration_seconds && (
                            <div className="text-sm text-gray-500">
                              {Math.floor(match.duration_seconds / 60)}:{(match.duration_seconds % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-3xl font-heading text-gray-400">VS</div>
                      )}
                    </div>

                    <div className={`text-left ${match.result === 'b_win' ? 'text-green-600 font-bold' : ''}`}>
                      <div className="text-xl font-heading">{match.player_b?.name || 'TBD'}</div>
                    </div>
                  </div>

                  <a
                    href={`/events/${eventId}/matches/${match.id}/result`}
                    className={`px-6 py-3 rounded-lg font-heading font-bold text-lg transition ${
                      match.result
                        ? 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                        : 'bg-mbjj-red hover:bg-mbjj-accent-hover text-white'
                    }`}
                  >
                    {match.result ? 'EDIT' : 'ENTER RESULT'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
