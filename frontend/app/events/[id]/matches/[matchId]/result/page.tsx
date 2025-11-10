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
}

const SUBMISSION_METHODS = [
  "Rear Naked Choke",
  "Guillotine",
  "Triangle",
  "Arm Bar",
  "Kimura",
  "Americana",
  "Darce",
  "Anaconda",
  "Heel Hook",
  "Knee Bar",
  "Ankle Lock",
  "Toe Hold",
  "Head and Arm Choke",
  "North-South Choke",
  "Ezekiel",
  "Baseball Choke",
  "Bow and Arrow",
  "Calf Slicer",
  "Bicep Slicer",
  "Other"
];

export default function MatchResultPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const matchId = resolvedParams.matchId;
  const router = useRouter();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [result, setResult] = useState<'a_win' | 'b_win' | 'draw'>('a_win');
  const [method, setMethod] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  // Redirect if in read-only mode
  useEffect(() => {
    if (config.readOnly) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/events/${eventId}/matches`);
      if (res.ok) {
        const matches = await res.json();
        const foundMatch = matches.find((m: Match) => m.id === parseInt(matchId));
        if (foundMatch) {
          setMatch(foundMatch);

          // Pre-fill if editing
          if (foundMatch.result) {
            setResult(foundMatch.result);
          }
          if (foundMatch.method) {
            setMethod(foundMatch.method);
          }
          if (foundMatch.duration_seconds) {
            const mins = Math.floor(foundMatch.duration_seconds / 60);
            const secs = foundMatch.duration_seconds % 60;
            setMinutes(mins.toString());
            setSeconds(secs.toString());
          }
        }
      }
    } catch (error) {
      console.error('Failed to load match:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveResult = async () => {
    if (!match) return;

    if (result !== 'draw' && !method) {
      alert('Please select a submission method');
      return;
    }

    const durationSeconds = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);

    setSaving(true);
    try {
      const res = await fetch(`${config.apiUrl}/api/matches/${matchId}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: result,
          method: result === 'draw' ? null : method,
          duration_seconds: durationSeconds > 0 ? durationSeconds : null
        })
      });

      if (res.ok) {
        alert('Result saved successfully!');
        window.location.href = `/events/${eventId}/brackets`;
      } else {
        alert('Failed to save result');
      }
    } catch (error) {
      console.error('Save result error:', error);
      alert('Failed to save result');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-mbjj-dark">
        <div className="text-2xl font-heading text-gray-600 dark:text-gray-400">LOADING...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-mbjj-dark">
        <div className="text-2xl font-heading text-red-600">MATCH NOT FOUND</div>
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
            <a href={`/events/${eventId}/brackets`} className="text-mbjj-red hover:text-mbjj-accent-light">
              ← Brackets
            </a>
          </div>
          <h1 className="text-4xl font-heading font-bold mt-2">ENTER MATCH RESULT</h1>
          <p className="text-gray-300 mt-2">Match #{match.match_number}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Fighters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8">
          <div className="grid grid-cols-3 gap-8 items-center">
            <div className="text-center">
              {match.player_a?.photo_url && (
                <img src={match.player_a.photo_url} alt={match.player_a.name} className="w-32 h-32 rounded-full mx-auto mb-4" />
              )}
              <h2 className="text-3xl font-heading font-bold">{match.player_a?.name}</h2>
            </div>

            <div className="text-center">
              <div className="text-6xl font-heading text-gray-400">VS</div>
            </div>

            <div className="text-center">
              {match.player_b?.photo_url && (
                <img src={match.player_b.photo_url} alt={match.player_b.name} className="w-32 h-32 rounded-full mx-auto mb-4" />
              )}
              <h2 className="text-3xl font-heading font-bold">{match.player_b?.name}</h2>
            </div>
          </div>
        </div>

        {/* Result Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-heading font-bold mb-6">WHO WON?</h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setResult('a_win')}
              className={`p-6 rounded-lg border-2 font-heading font-bold text-xl transition ${
                result === 'a_win'
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 hover:border-green-500'
              }`}
            >
              {match.player_a?.name}
            </button>

            <button
              onClick={() => setResult('draw')}
              className={`p-6 rounded-lg border-2 font-heading font-bold text-xl transition ${
                result === 'draw'
                  ? 'border-gray-500 bg-gray-500 text-white'
                  : 'border-gray-300 hover:border-gray-500'
              }`}
            >
              DRAW
            </button>

            <button
              onClick={() => setResult('b_win')}
              className={`p-6 rounded-lg border-2 font-heading font-bold text-xl transition ${
                result === 'b_win'
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 hover:border-green-500'
              }`}
            >
              {match.player_b?.name}
            </button>
          </div>
        </div>

        {/* Submission Method */}
        {result !== 'draw' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8">
            <h3 className="text-2xl font-heading font-bold mb-6">SUBMISSION METHOD</h3>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg font-bold"
            >
              <option value="">Select submission...</option>
              {SUBMISSION_METHODS.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}

        {/* Duration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-heading font-bold mb-6">MATCH TIME</h3>
          <div className="flex gap-4 items-center justify-center">
            <input
              type="number"
              placeholder="0"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-24 p-4 border-2 border-gray-300 rounded-lg text-2xl font-bold text-center"
            />
            <span className="text-3xl font-heading">:</span>
            <input
              type="number"
              placeholder="00"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              className="w-24 p-4 border-2 border-gray-300 rounded-lg text-2xl font-bold text-center"
            />
            <span className="text-lg text-gray-600">(minutes : seconds)</span>
          </div>
        </div>

        {/* Save Button */}
        <div className="text-center">
          <button
            onClick={saveResult}
            disabled={saving}
            className="px-16 py-6 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-3xl rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'SAVE RESULT'}
          </button>
        </div>
      </main>
    </div>
  );
}
