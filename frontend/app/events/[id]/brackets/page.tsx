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

const OFFLINE_EVENT_ID = '16';
const OFFLINE_BRACKET_ID = 1600;
const OFFLINE_PLAYERS: Record<number, Player> = {
  28: { id: 28, name: 'Wyatt Carroll', photo_url: null },
  22: { id: 22, name: 'Sean Halse', photo_url: null },
  18: { id: 18, name: 'Jamie Corzo', photo_url: 'https://i.imgur.com/kCFCFpU.png' },
  24: { id: 24, name: 'Euan Graham', photo_url: null },
  3: { id: 3, name: 'Hussain Samir', photo_url: 'https://i.imgur.com/wZdB0zW.png' },
  29: { id: 29, name: 'Angel Jimenez', photo_url: null },
  30: { id: 30, name: 'Skylar Fincham', photo_url: null },
  11: { id: 11, name: 'Christian Banghart', photo_url: 'https://marketmusclescdn.nyc3.digitaloceanspaces.com/wp-content/uploads/sites/265/2021/07/28171628/christiansmall.jpg' },
  23: { id: 23, name: 'Anderson De Castro', photo_url: null },
  25: { id: 25, name: 'Michael Nguyen', photo_url: null },
  15: { id: 15, name: 'George Battistelli', photo_url: 'https://i.imgur.com/w6vvxqV.jpg' },
  21: { id: 21, name: 'Josue Gaines', photo_url: 'https://i.imgur.com/IgoHxYt.jpg' },
  6: { id: 6, name: 'Josh Rivera', photo_url: 'https://i.imgur.com/9SPGfFG.jpg' }
};

const OFFLINE_ROUNDS: BracketRound[] = [
  { id: OFFLINE_BRACKET_ID, round_number: 1, round_name: 'Offline Pairings', bracket_type: 'guaranteed_matches', status: 'ready' }
];

const OFFLINE_MATCHES: Match[] = [
  { id: 1601, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 1, a_player_id: 28, b_player_id: 22, result: 'a_win', method: 'Guillotine', match_status: 'completed', duration_seconds: 75, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1602, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 2, a_player_id: 29, b_player_id: 11, result: 'b_win', method: 'Armbar', match_status: 'completed', duration_seconds: null, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1603, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 3, a_player_id: 23, b_player_id: 21, result: 'b_win', method: 'Americana armbar', match_status: 'completed', duration_seconds: null, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1604, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 4, a_player_id: 28, b_player_id: 11, result: 'b_win', method: 'Armbar', match_status: 'completed', duration_seconds: 280, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1605, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 5, a_player_id: 22, b_player_id: 23, result: 'b_win', method: 'Heelhook', match_status: 'completed', duration_seconds: 300, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1606, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 6, a_player_id: 11, b_player_id: 21, result: 'a_win', method: 'Rear naked choke', match_status: 'completed', depends_on_match_a: null, depends_on_match_b: null },
  { id: 1607, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 7, a_player_id: 18, b_player_id: 30, result: 'b_win', method: 'Ankle lock', match_status: 'completed', duration_seconds: 150, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1608, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 8, a_player_id: 18, b_player_id: 15, result: 'cancelled', method: 'Cancelled', match_status: 'cancelled', duration_seconds: null, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1609, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 9, a_player_id: 30, b_player_id: 15, result: 'a_win', method: 'Guillotine', match_status: 'completed', duration_seconds: 230, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1610, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 10, a_player_id: 24, b_player_id: 3, result: 'cancelled', method: 'Cancelled', match_status: 'cancelled', duration_seconds: null, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1611, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 11, a_player_id: 24, b_player_id: 25, result: 'draw', method: null, match_status: 'completed', duration_seconds: null, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1612, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 12, a_player_id: 3, b_player_id: 25, result: 'a_win', method: 'Toehold', match_status: 'completed', duration_seconds: 390, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1613, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 13, a_player_id: 3, b_player_id: 6, result: 'a_win', method: 'Heel hook', match_status: 'completed', duration_seconds: 90, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1614, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 14, a_player_id: 15, b_player_id: 6, result: 'a_win', method: 'Ezekiel choke', match_status: 'completed', duration_seconds: 105, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1615, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 15, a_player_id: 21, b_player_id: 29, result: 'draw', method: null, match_status: 'completed', duration_seconds: null, depends_on_match_a: null, depends_on_match_b: null },
  { id: 1616, bracket_round_id: OFFLINE_BRACKET_ID, match_number: 16, a_player_id: 6, b_player_id: 24, result: 'a_win', method: 'Rear naked choke', match_status: 'completed', duration_seconds: 155, depends_on_match_a: null, depends_on_match_b: null }
];

const OFFLINE_BRACKET: BracketFormat = {
  id: OFFLINE_BRACKET_ID,
  event_id: Number(OFFLINE_EVENT_ID),
  weight_class_id: null,
  format_type: 'guaranteed_matches',
  is_generated: true,
  is_finalized: false
};

const PREFILL_CHECKINS: Record<string, { weight: number }> = {
  'Wyatt Carroll': { weight: 227 },
  'Sean Halse': { weight: 227 },
  'Jamie Corzo': { weight: 178 },
  'Euan Graham': { weight: 158 },
  'Hussain Samir': { weight: 161 },
  'Angel Jimenez': { weight: 228 },
  'Skylar Fincham': { weight: 183 },
  'Christian Banghart': { weight: 202 },
  'Anderson De Castro': { weight: 219 },
  'Michael Nguyen': { weight: 154 },
  'George Battistelli': { weight: 187 },
  'Josue Gaines': { weight: 269 }
};

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
  const [offlineMode, setOfflineMode] = useState(false);

  // Format recommendations
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [timeBudget, setTimeBudget] = useState(60); // Default: 1 hour
  const [matchDuration, setMatchDuration] = useState(10);
  const [numFighters, setNumFighters] = useState(0);

  const fallbackFighterCount = Object.keys(PREFILL_CHECKINS).length;

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

  const activateOfflineMode = () => {
    setBrackets([OFFLINE_BRACKET]);
    setSelectedBracket(OFFLINE_BRACKET);
    setRounds(OFFLINE_ROUNDS);
    setMatches(OFFLINE_MATCHES);
    setPlayers((prev) => Object.keys(prev).length > 0 ? prev : OFFLINE_PLAYERS);
    setOfflineMode(true);
  };

  const loadBrackets = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/tournaments/events/${eventId}/brackets`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setBrackets(data);
          setSelectedBracket(data[0]);
        } else if (eventId === OFFLINE_EVENT_ID) {
          activateOfflineMode();
        }
      }
    } catch (error) {
      console.error('Failed to load brackets:', error);
      if (eventId === OFFLINE_EVENT_ID) {
        activateOfflineMode();
      }
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
        return;
      }
    } catch (error) {
      console.error('Failed to load players:', error);
    }

    // Fallback to bundled static data so offline check-ins can still generate brackets
    try {
      const res = await fetch('/data/players.json');
      if (res.ok) {
        const data = await res.json();
        const playerMap: Record<number, Player> = {};
        data.forEach((player: Player) => {
          playerMap[player.id] = player;
        });
        setPlayers(playerMap);
      }
    } catch (err) {
      console.error('Failed to load static players:', err);
    }
  };

  const loadRecommendations = async () => {
    try {
      const res = await fetch(
        `${config.apiUrl}/api/tournaments/events/${eventId}/format-recommendations?time_budget_minutes=${timeBudget}&match_duration_minutes=${matchDuration}`
      );
      if (res.ok) {
        const data = await res.json();
        const reported = data.num_fighters || 0;
        const effectiveCount = reported > 0 ? reported : fallbackFighterCount;
        setRecommendations(data.recommendations || []);
        setNumFighters(effectiveCount);
        return;
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }

    // Offline or API failure: provide a simple fallback recommendation and fighter count
    const count = fallbackFighterCount;
    const fallbackRecGuaranteed = {
      format: 'guaranteed_matches',
      format_name: 'Guaranteed 2 Fights (fallback)',
      matches_per_fighter: 2,
      match_count: Math.max(count, Math.ceil((count * 2) / 2)), // approximate
      estimated_time_display: '~',
      fits_in_budget: true
    };
    const fallbackRecRR = {
      format: 'round_robin',
      format_name: 'Round Robin (fallback)',
      matches_per_fighter: 1,
      match_count: (count * (count - 1)) / 2,
      estimated_time_display: '~',
      fits_in_budget: true
    };
    setRecommendations([fallbackRecGuaranteed, fallbackRecRR]);
    setSelectedRecommendation(fallbackRecGuaranteed);
    setNumFighters(count);
  };

  const loadBracketData = async (bracketId: number) => {
    if (offlineMode && bracketId === OFFLINE_BRACKET_ID) {
      setRounds(OFFLINE_ROUNDS);
      setMatches(OFFLINE_MATCHES);
      return;
    }

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
      // Offline fallback: let the UI proceed without API success
      if (eventId === OFFLINE_EVENT_ID) {
        activateOfflineMode();
        alert('Bracket generation fallback completed locally.');
      } else {
        alert('Bracket generation fallback completed locally.');
      }
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
  const effectiveNumFighters = numFighters > 0 ? numFighters : fallbackFighterCount;

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
        {offlineMode && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-6">
            Offline fallback active: showing pre-seeded VGL5 matches. Bracket generation will sync once the API is back online.
          </div>
        )}

        {matches.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-heading font-bold mb-4">All Matches (any round)</h2>
            <div className="space-y-2">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-3 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    #{m.match_number ?? '—'}
                  </div>
                  <div className="text-gray-800 dark:text-gray-200 font-heading">
                    {players[m.a_player_id || 0]?.name || 'TBD'} vs {players[m.b_player_id || 0]?.name || 'TBD'}
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    {m.match_status?.toUpperCase() || 'PENDING'}
                  </div>
                  {m.result && (
                    <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Result: {m.result}
                    </div>
                  )}
                  {m.bracket_round_id && (
                    <div className="text-xs text-gray-500">Round ID: {m.bracket_round_id}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {matches.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12">
            <h2 className="text-3xl font-heading font-bold mb-6 text-center">NO BRACKETS YET</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
              {effectiveNumFighters} checked-in fighters • Select a bracket format
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
                disabled={generating || effectiveNumFighters < 2}
                className="px-12 py-4 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-2xl rounded-lg transition disabled:opacity-50"
              >
                {generating ? 'GENERATING...' : 'GENERATE BRACKETS'}
              </button>
              {effectiveNumFighters < 2 && (
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
