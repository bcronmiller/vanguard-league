'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface Player {
  id: number;
  name: string;
  photo_url: string | null;
  bjj_belt_rank: string | null;
  age: number | null;
  weight: number | null;
  weight_class: { name: string } | null;
  academy: string | null;
  elo_rating: number;
  initial_elo_rating: number | null;
}

interface MatchHistory {
  match_id: number;
  event_id: number;
  event_name: string;
  event_date: string;
  opponent: {
    id: number;
    name: string;
    photo_url: string | null;
  };
  result: string;
  method: string | null;
  duration_seconds: number | null;
  match_number: number;
  belt_rank: string | null;
  weight: number | null;
  weight_class: string | null;
  elo_change: number | null;
}

interface Badge {
  name: string;
  description: string;
  icon: string;
}

interface Division {
  weight_class_id: number;
  weight_class_name: string;
  wins: number;
  losses: number;
  draws: number;
  elo_rating: number;
  initial_elo_rating: number;
  elo_change: number;
}

interface DivisionData {
  player_id: number;
  player_name: string;
  overall: {
    wins: number;
    losses: number;
    draws: number;
    elo_rating: number;
    elo_change: number;
  };
  divisions: Division[];
}

export default function PlayerProfilePage({ params }: { params: { id: string } }) {
  const playerId = params.id;
  const readOnly = config.readOnly;

  const [player, setPlayer] = useState<Player | null>(null);
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [ranking, setRanking] = useState<{ rank: number; total: number; weightClass: string } | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [divisions, setDivisions] = useState<DivisionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayer();
    loadMatches();
    loadRanking();
    loadBadges();
    loadDivisions();
  }, [playerId]);

  const loadPlayer = async () => {
    try {
      const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
      const endpoint = isStatic ? `/data/player-${playerId}.json` : `${config.apiUrl}/api/players/${playerId}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setPlayer(data);

        // In static mode, player data includes matches, badges, and divisions
        if (isStatic) {
          if (data.matches) {
            setMatches(data.matches);
          }
          if (data.badges) {
            setBadges(data.badges);
          }
          if (data.divisions) {
            setDivisions(data.divisions);
          }
          setLoading(false); // Set loading false here in static mode since we have all data
        }
      }
    } catch (error) {
      console.error('Failed to load player:', error);
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    // In static mode, matches are loaded with player data
    const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
    if (isStatic) {
      return; // Matches already loaded in loadPlayer
    }

    try {
      const endpoint = `${config.apiUrl}/api/players/${playerId}/matches`;
      const res = await fetch(endpoint);
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

  const loadRanking = async () => {
    try {
      const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
      const endpoint = isStatic ? '/data/ladder-overall.json' : `${config.apiUrl}/api/ladder`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const ladder = await res.json();

        // Filter out any invalid entries and find player's ranking
        const validLadder = ladder.filter((s: any) => s && s.player && s.player.id);
        const playerStanding = validLadder.find((s: any) => s.player.id === parseInt(playerId));

        if (playerStanding && playerStanding.player.weight) {
          const weight = playerStanding.player.weight;
          let weightClass = '';
          let classLadder = [];

          if (weight < 170) {
            weightClass = 'Lightweight';
            classLadder = validLadder.filter((s: any) => s.player.weight && s.player.weight < 170);
          } else if (weight >= 170 && weight <= 200) {
            weightClass = 'Middleweight';
            classLadder = validLadder.filter((s: any) => s.player.weight && s.player.weight >= 170 && s.player.weight <= 200);
          } else {
            weightClass = 'Heavyweight';
            classLadder = validLadder.filter((s: any) => s.player.weight && s.player.weight > 200);
          }

          // Sort by ELO gain (performance vs expectations)
          classLadder.sort((a: any, b: any) => {
            const aGain = a.player.initial_elo_rating
              ? a.player.elo_rating - a.player.initial_elo_rating
              : 0;
            const bGain = b.player.initial_elo_rating
              ? b.player.elo_rating - b.player.initial_elo_rating
              : 0;
            return bGain - aGain; // Descending (highest gain first)
          });

          const rank = classLadder.findIndex((s: any) => s.player.id === parseInt(playerId)) + 1;
          setRanking({ rank, total: classLadder.length, weightClass });
        }
      }
    } catch (error) {
      console.error('Failed to load ranking:', error);
    }
  };

  const loadBadges = async () => {
    try {
      const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
      if (isStatic) {
        // Badges loaded with player data
        return;
      }
      const endpoint = `${config.apiUrl}/api/players/${playerId}/badges`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setBadges(data);
      }
    } catch (error) {
      console.error('Failed to load badges:', error);
    }
  };

  const loadDivisions = async () => {
    try {
      const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
      if (isStatic) {
        // Divisions loaded with player data
        return;
      }
      const endpoint = `${config.apiUrl}/api/players/${playerId}/divisions`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setDivisions(data);
      }
    } catch (error) {
      console.error('Failed to load divisions:', error);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRecord = () => {
    const wins = matches.filter(m => m.result === 'win').length;
    const losses = matches.filter(m => m.result === 'loss').length;
    const draws = matches.filter(m => m.result === 'draw').length;
    return { wins, losses, draws };
  };

  if (loading || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-mbjj-dark">
        <div className="text-2xl font-heading text-gray-600 dark:text-gray-400">LOADING...</div>
      </div>
    );
  }

  const record = getRecord();
  const cleanName = player.name.replace('*', '');

  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      <header className="bg-mbjj-dark text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 mb-3">
            <a href="/" className="text-mbjj-red hover:text-mbjj-accent-light">
              ← Home
            </a>
            <span className="text-gray-600">|</span>
            <a href="/players" className="text-mbjj-red hover:text-mbjj-accent-light">
              ← Players
            </a>
          </div>
          <h1 className="text-4xl font-heading font-bold">FIGHTER PROFILE</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8">
          <div className="flex items-start gap-8">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <img
                src={player.photo_url || '/default-fighter.svg'}
                alt={cleanName}
                className="w-48 h-48 rounded-lg object-cover border-4 border-mbjj-red"
              />
            </div>

            {/* Stats */}
            <div className="flex-1">
              <h2 className="text-5xl font-heading font-bold mb-4 text-gray-900 dark:text-white">
                {cleanName}
              </h2>

              {/* Badges */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {badges.map((badge, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 bg-mbjj-red text-white px-4 py-2 rounded-full font-heading text-sm"
                      title={badge.description}
                    >
                      <span className="text-xl">{badge.icon}</span>
                      <span>{badge.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Division Stats - Show each weight class separately */}
              {divisions && divisions.divisions && divisions.divisions.length > 0 ? (
                <div className="mb-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">DIVISION RECORDS</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {divisions.divisions.map((division) => (
                      <div
                        key={division.weight_class_id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-mbjj-blue"
                      >
                        <div className="text-lg font-heading font-bold text-mbjj-blue mb-2">
                          {division.weight_class_name.toUpperCase()}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Record: </span>
                            <span className="text-xl font-heading font-bold text-mbjj-red">
                              {division.wins}-{division.losses}-{division.draws}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">ELO: </span>
                            <span className={`text-xl font-heading font-bold ${
                              division.elo_change >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {division.elo_change >= 0 ? '+' : ''}{Math.round(division.elo_change)}
                            </span>
                            <span className="text-sm ml-2 text-gray-500 dark:text-gray-400">
                              ({Math.round(division.elo_rating)})
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Fallback to overall stats if no division data */
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                  {/* Record */}
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">RECORD</div>
                    <div className="text-3xl font-heading font-bold text-mbjj-red">
                      {record.wins}-{record.losses}-{record.draws}
                    </div>
                  </div>

                  {/* ELO Change */}
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">ELO CHANGE</div>
                    {player.initial_elo_rating && (
                      <div className={`text-3xl font-heading font-bold ${
                        (player.elo_rating - player.initial_elo_rating) >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {(player.elo_rating - player.initial_elo_rating) >= 0 ? '+' : ''}
                        {Math.round(player.elo_rating - player.initial_elo_rating)}
                      </div>
                    )}
                    <div className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                      ({Math.round(player.elo_rating)})
                    </div>
                  </div>

                  {/* Ranking */}
                  {ranking && (
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {ranking.weightClass.toUpperCase()} RANK
                      </div>
                      <div className="text-3xl font-heading font-bold text-mbjj-blue">
                        #{ranking.rank} <span className="text-lg text-gray-500">of {ranking.total}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fighter Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Belt Rank */}
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">BELT RANK</div>
                  <div className="text-2xl font-heading font-bold">
                    {player.bjj_belt_rank || 'Unknown'}
                  </div>
                </div>

                {/* Current Weight */}
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">CURRENT WEIGHT</div>
                  <div className="text-2xl font-heading font-bold">
                    {player.weight ? `${player.weight} lbs` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Age and Academy */}
              <div className="space-y-1">
                {player.age && (
                  <div className="text-gray-600 dark:text-gray-400">
                    Age: <span className="font-bold">{player.age}</span>
                  </div>
                )}
                {player.academy && (
                  <div className="text-gray-600 dark:text-gray-400">
                    Academy: <span className="font-bold">{player.academy}</span>
                  </div>
                )}
              </div>

              {/* Edit Profile Button - Hidden in read-only mode */}
              {!readOnly && (
                <div className="mt-6">
                  <a
                    href={`/players/${player.id}/edit`}
                    className="inline-block bg-mbjj-red hover:bg-mbjj-accent-light text-white font-heading font-bold py-3 px-8 rounded-lg transition"
                  >
                    EDIT PROFILE
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <h3 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
            FIGHT HISTORY ({matches.length} {matches.length === 1 ? 'Match' : 'Matches'})
          </h3>

          {matches.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-12">
              No matches recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.match_id}
                  className={`border-l-4 p-6 rounded-lg ${
                    match.result === 'win'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : match.result === 'loss'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-500 bg-gray-50 dark:bg-gray-700/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Result Badge */}
                    <div className="flex-shrink-0">
                      <div
                        className={`text-2xl font-heading font-bold px-4 py-2 rounded-lg ${
                          match.result === 'win'
                            ? 'bg-green-600 text-white'
                            : match.result === 'loss'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        {match.result.toUpperCase()}
                      </div>
                    </div>

                    {/* Match Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-2xl font-heading font-bold">
                          vs {match.opponent.name.replace('*', '')}
                        </h4>
                      </div>

                      <div className="flex flex-wrap gap-6 text-sm text-gray-700 dark:text-gray-300">
                        <div>
                          <span className="font-bold">Event:</span> {match.event_name}
                        </div>
                        <div>
                          <span className="font-bold">Date:</span> {formatDate(match.event_date)}
                        </div>
                        {match.belt_rank && (
                          <div>
                            <span className="font-bold">Belt:</span> {match.belt_rank}
                          </div>
                        )}
                        {match.weight && (
                          <div>
                            <span className="font-bold">Weight:</span> {match.weight} lbs
                          </div>
                        )}
                        {match.weight_class && (
                          <div>
                            <span className="font-bold">Class:</span> {match.weight_class}
                          </div>
                        )}
                        {match.method && (
                          <div>
                            <span className="font-bold">Method:</span> {match.method}
                          </div>
                        )}
                        {match.duration_seconds && (
                          <div>
                            <span className="font-bold">Time:</span> {formatTime(match.duration_seconds)}
                          </div>
                        )}
                        {match.elo_change !== null && match.elo_change !== undefined && (
                          <div>
                            <span className="font-bold">ELO:</span>{' '}
                            <span className={`font-bold ${
                              match.elo_change >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {match.elo_change >= 0 ? '+' : ''}{match.elo_change}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Opponent Photo */}
                    {match.opponent.photo_url && (
                      <a href={`/players/${match.opponent.id}`} className="flex-shrink-0">
                        <img
                          src={match.opponent.photo_url}
                          alt={match.opponent.name}
                          className="w-16 h-16 rounded-full border-2 border-gray-300 hover:border-mbjj-red transition"
                        />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
