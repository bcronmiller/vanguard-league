'use client';

import { useEffect, useState } from 'react';
import { config } from '@/lib/config';

type Fighter = {
  id: number;
  name: string;
  photo_url: string | null;
  academy: string | null;
  bjj_belt_rank: string | null;
  weight: number | null;
  elo_rating: number | null;
  wins: number;
  losses: number;
  draws: number;
  win_streak: number;
};

type TaleOfTape = {
  match_id: number;
  match_status: string;
  round_name: string | null;
  player_a: Fighter;
  player_b: Fighter;
  head_to_head: {
    total_matches: number;
    player_a_wins: number;
    player_b_wins: number;
    draws: number;
    recent_matches: any[];
  };
  elo_preview: any;
};

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
    name: "Game Day Men's Health",
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

export default function TapeOverlayPage({ params }: { params: { matchId: string } }) {
  const matchId = params.matchId;
  const chroma = true; // always green-screen mode

  const [data, setData] = useState<TaleOfTape | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sponsor = SPONSORS[Number(matchId) % SPONSORS.length];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/api/tournaments/matches/${matchId}/tale-of-the-tape`);
        if (!res.ok) {
          throw new Error('Match not ready');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err?.message || 'Unable to load match');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [matchId]);

  const bgStyle = { backgroundColor: '#00ff00' };
  const panelBg = 'rgba(0,0,0,0.85)';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <div className="text-3xl font-heading text-white">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <div
          className="text-center p-8 rounded-xl text-white"
          style={{ background: panelBg, backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <div className="text-2xl font-heading font-bold mb-2">Not Ready</div>
          <div className="text-sm text-gray-200">
            {error || 'This match is not available yet. Generate pairings first.'}
          </div>
        </div>
      </div>
    );
  }

  const { player_a, player_b, round_name, head_to_head, elo_preview } = data;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ ...bgStyle, color: '#fff' }}>
      <div
        className="w-full max-w-6xl rounded-3xl shadow-2xl border border-white/20"
        style={{
          background: panelBg,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.55)',
        }}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/15 flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-wide text-gray-300">{round_name || 'Match'}</div>
            <div className="text-3xl font-heading font-bold text-white">Tale of the Tape</div>
          </div>
          <div className="text-gray-300 text-sm">Match #{data.match_id}</div>
        </div>

        {/* Main compare row */}
        <div className="grid md:grid-cols-3 gap-8 px-8 py-10 items-center">
          {/* Fighter A */}
          <div className="text-right space-y-4">
            <div className="flex justify-end">
              {player_a.photo_url ? (
                <img
                  src={player_a.photo_url}
                  alt={player_a.name}
                  className="w-36 h-36 rounded-full object-cover border-4 border-white/60 shadow-2xl"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-white/10 border-4 border-white/40 shadow-2xl flex items-center justify-center text-white/70 text-3xl">
                  ?
                </div>
              )}
            </div>
            <div className="text-3xl font-heading font-bold text-white leading-tight">{player_a.name}</div>
            {player_a.academy && <div className="text-sm text-gray-200">{player_a.academy}</div>}
            <div className="space-y-2 text-sm text-gray-100 bg-white/5 rounded-lg p-3 border border-white/10">
              <StatLine label="Belt" value={player_a.bjj_belt_rank || 'N/A'} align="right" />
              <StatLine label="Weight" value={player_a.weight ? `${player_a.weight} lbs` : 'N/A'} align="right" />
              <StatLine
                label="ELO"
                value={player_a.elo_rating ? Math.round(player_a.elo_rating).toString() : 'N/A'}
                align="right"
                highlight
              />
              <StatLine
                label="Record"
                value={`${player_a.wins}-${player_a.losses}-${player_a.draws}`}
                align="right"
              />
              {player_a.win_streak > 0 && (
                <StatLine label="Streak" value={`🔥 ${player_a.win_streak}`} align="right" highlight />
              )}
            </div>
          </div>

          {/* VS / Sponsor / H2H */}
          <div className="text-center space-y-4 border-x border-white/15 px-4">
            <div className="text-xs text-gray-200">SPONSORED BY</div>
            <div className="flex justify-center">
              <img src={sponsor.logo} alt={sponsor.name} className="h-16 w-auto object-contain drop-shadow-lg" />
            </div>
            <div className="text-xs text-gray-300">{sponsor.name}</div>

            <div className="text-6xl font-heading font-bold text-white drop-shadow-lg">VS</div>
            {round_name && <div className="text-gray-200 text-sm">{round_name}</div>}

            {head_to_head && head_to_head.total_matches > 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-white">
                <div className="text-xs text-gray-200 mb-1">Previous Fights</div>
                <div className="text-2xl font-heading font-bold">
                  {head_to_head.player_a_wins} - {head_to_head.player_b_wins}
                  {head_to_head.draws > 0 && ` - ${head_to_head.draws}`}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-300">First meeting</div>
            )}
          </div>

          {/* Fighter B */}
          <div className="text-left space-y-4">
            <div className="flex justify-start">
              {player_b.photo_url ? (
                <img
                  src={player_b.photo_url}
                  alt={player_b.name}
                  className="w-36 h-36 rounded-full object-cover border-4 border-white/60 shadow-2xl"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-white/10 border-4 border-white/40 shadow-2xl flex items-center justify-center text-white/70 text-3xl">
                  ?
                </div>
              )}
            </div>
            <div className="text-3xl font-heading font-bold text-white leading-tight">{player_b.name}</div>
            {player_b.academy && <div className="text-sm text-gray-200">{player_b.academy}</div>}
            <div className="space-y-2 text-sm text-gray-100 bg-white/5 rounded-lg p-3 border border-white/10">
              <StatLine label="Belt" value={player_b.bjj_belt_rank || 'N/A'} />
              <StatLine label="Weight" value={player_b.weight ? `${player_b.weight} lbs` : 'N/A'} />
              <StatLine
                label="ELO"
                value={player_b.elo_rating ? Math.round(player_b.elo_rating).toString() : 'N/A'}
                highlight
              />
              <StatLine label="Record" value={`${player_b.wins}-${player_b.losses}-${player_b.draws}`} />
              {player_b.win_streak > 0 && <StatLine label="Streak" value={`🔥 ${player_b.win_streak}`} highlight />}
            </div>
          </div>
        </div>

        {/* Previous matches */}
        {head_to_head?.recent_matches && head_to_head.recent_matches.length > 0 && (
          <div className="px-8 pb-4">
            <div className="bg-black/50 border border-white/15 rounded-lg p-4 text-white">
              <div className="text-sm font-heading font-bold mb-3">Previous Matches</div>
              <div className="space-y-3">
                {head_to_head.recent_matches.map((m: any, idx: number) => {
                  const isDraw = m.result === 'draw';
                  const aWin = m.result === 'player_a_win' || m.winner_id === player_a.id;
                  const bWin = m.result === 'player_b_win' || m.winner_id === player_b.id;

                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-white/15 bg-white/5 p-3 flex justify-between text-sm"
                    >
                      <div>
                        <div className="font-heading font-bold">
                          {isDraw ? (
                            <span className="text-yellow-300">DRAW</span>
                          ) : aWin ? (
                            <span className="text-green-300">{player_a.name} WON</span>
                          ) : (
                            <span className="text-green-300">{player_b.name} WON</span>
                          )}
                        </div>
                        {m.method && <div className="text-gray-200">Method: {m.method}</div>}
                        {m.duration_seconds && (
                          <div className="text-gray-200">
                            Time: {Math.floor(m.duration_seconds / 60)}:
                            {(m.duration_seconds % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-gray-300">
                        {m.event_name && <div className="font-bold">{m.event_name}</div>}
                        {m.round_name && <div className="text-xs">{m.round_name}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ELO impact */}
        {elo_preview && (
          <div className="px-8 pb-8">
            <div className="bg-black/55 border border-white/15 rounded-xl p-5 text-white space-y-4">
              <div className="text-lg font-heading font-bold">ELO Impact</div>

              {/* Betting odds */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/10 text-sm">
                <div>
                  <div className="text-gray-300">Betting Odds</div>
                  <div className="text-3xl font-heading font-bold text-green-300">
                    {getAmericanOdds(elo_preview.player_a.expected_score)}
                  </div>
                  <div className="text-xs text-gray-200 mt-1">
                    {elo_preview.player_a.expected_score}% win probability
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-300">Betting Odds</div>
                  <div className="text-3xl font-heading font-bold text-green-300">
                    {getAmericanOdds(elo_preview.player_b.expected_score)}
                  </div>
                  <div className="text-xs text-gray-200 mt-1">
                    {elo_preview.player_b.expected_score}% win probability
                  </div>
                </div>
              </div>

              {/* Outcomes */}
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <OutcomeCard
                  title={`If ${player_a.name.toUpperCase()} Wins`}
                  titleColor="text-green-300"
                  aLabel={player_a.name}
                  bLabel={player_b.name}
                  aChange={elo_preview.outcomes.player_a_wins.player_a_change}
                  bChange={elo_preview.outcomes.player_a_wins.player_b_change}
                  aNew={elo_preview.outcomes.player_a_wins.player_a_new_elo}
                  bNew={elo_preview.outcomes.player_a_wins.player_b_new_elo}
                />
                <OutcomeCard
                  title={`If ${player_b.name.toUpperCase()} Wins`}
                  titleColor="text-green-300"
                  aLabel={player_a.name}
                  bLabel={player_b.name}
                  aChange={elo_preview.outcomes.player_b_wins.player_a_change}
                  bChange={elo_preview.outcomes.player_b_wins.player_b_change}
                  aNew={elo_preview.outcomes.player_b_wins.player_a_new_elo}
                  bNew={elo_preview.outcomes.player_b_wins.player_b_new_elo}
                />
                <OutcomeCard
                  title="If Draw"
                  titleColor="text-yellow-300"
                  aLabel={player_a.name}
                  bLabel={player_b.name}
                  aChange={elo_preview.outcomes.draw.player_a_change}
                  bChange={elo_preview.outcomes.draw.player_b_change}
                  aNew={elo_preview.outcomes.draw.player_a_new_elo}
                  bNew={elo_preview.outcomes.draw.player_b_new_elo}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatLine({ label, value, align = 'left', highlight = false }: { label: string; value: string; align?: 'left' | 'right'; highlight?: boolean }) {
  return (
    <div className={`flex ${align === 'right' ? 'justify-end gap-3' : 'gap-3'}`}>
      <span className="text-gray-400">{label}</span>
      <span className={`font-bold ${highlight ? 'text-yellow-300' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function OutcomeCard({
  title,
  titleColor,
  aLabel,
  bLabel,
  aChange,
  bChange,
  aNew,
  bNew,
}: {
  title: string;
  titleColor: string;
  aLabel: string;
  bLabel: string;
  aChange: number;
  bChange: number;
  aNew: number;
  bNew: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-white space-y-2">
      <div className={`text-xs font-bold ${titleColor}`}>{title}</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-center">
          <div className="text-gray-200">{aLabel}</div>
          <div className={`text-lg font-heading ${aChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {aChange > 0 ? '+' : ''}{aChange}
          </div>
          <div className="text-gray-300">{aNew}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-200">{bLabel}</div>
          <div className={`text-lg font-heading ${bChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {bChange > 0 ? '+' : ''}{bChange}
          </div>
          <div className="text-gray-300">{bNew}</div>
        </div>
      </div>
    </div>
  );
}

function getAmericanOdds(winProbability: number): string {
  const prob = winProbability / 100;
  if (prob >= 0.5) {
    const odds = -100 * (prob / (1 - prob));
    return Math.round(odds).toString();
  } else {
    const odds = 100 * ((1 - prob) / prob);
    return '+' + Math.round(odds).toString();
  }
}
