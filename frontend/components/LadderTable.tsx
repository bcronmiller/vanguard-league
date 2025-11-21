'use client';

import Link from 'next/link';
import { Fighter } from '@/lib/types';

interface LadderTableProps {
  fighters: Fighter[];
  colorTheme: 'red' | 'blue' | 'yellow';
  showWeightClass?: boolean; // Show "Weight Class" column instead of "Weight"
}

const themeColors = {
  red: {
    border: 'border-mbjj-red',
    header: 'bg-mbjj-red',
    rankText: 'text-mbjj-red',
    hoverBg: 'hover:bg-red-50',
    linkHover: 'hover:text-mbjj-red',
    photoBorder: 'border-mbjj-red',
  },
  blue: {
    border: 'border-mbjj-blue',
    header: 'bg-mbjj-blue',
    rankText: 'text-mbjj-blue',
    hoverBg: 'hover:bg-blue-50',
    linkHover: 'hover:text-mbjj-blue',
    photoBorder: 'border-mbjj-blue',
  },
  yellow: {
    border: 'border-yellow-500',
    header: 'bg-yellow-500',
    rankText: 'text-yellow-600',
    hoverBg: 'hover:bg-yellow-50',
    linkHover: 'hover:text-yellow-600',
    photoBorder: 'border-yellow-500',
  },
};

export default function LadderTable({ fighters, colorTheme, showWeightClass = false }: LadderTableProps) {
  const colors = themeColors[colorTheme];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4 ${colors.border}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${colors.header} text-white`}>
            <tr>
              <th className="px-6 py-4 text-left font-heading font-bold">RANK</th>
              <th className="px-6 py-4 text-left font-heading font-bold">FIGHTER</th>
              <th className="px-6 py-4 text-center font-heading font-bold">
                {showWeightClass ? 'WEIGHT CLASS' : 'WEIGHT'}
              </th>
              <th className="px-6 py-4 text-center font-heading font-bold">RECORD</th>
              <th className="px-6 py-4 text-center font-heading font-bold" title="Current ELO rating and change from starting rating">
                ELO RATING
              </th>
              <th className="px-6 py-4 text-left font-heading font-bold">BELT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {fighters.map((fighter, idx) => (
              <tr key={fighter.player.id} className={`${colors.hoverBg} dark:hover:bg-gray-700 transition`}>
                <td className="px-6 py-4">
                  <span className={`font-heading font-bold text-2xl ${colors.rankText}`}>#{idx + 1}</span>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/players/${fighter.player.id}`} className={`flex items-center gap-3 ${colors.linkHover} transition`}>
                    {fighter.player.photo_url && (
                      <img
                        src={fighter.player.photo_url}
                        alt={fighter.player.name}
                        className={`w-12 h-12 rounded-full border-2 ${colors.photoBorder} object-cover`}
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                        {fighter.player.name.replace('*', '')}
                      </span>
                      {fighter.player.academy && (
                        <span className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          {fighter.player.academy}
                        </span>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 text-center font-heading text-gray-600 dark:text-gray-400">
                  {showWeightClass
                    ? fighter.player.weight_class_name
                    : fighter.player.weight ? `${fighter.player.weight} lbs` : '-'}
                </td>
                <td className="px-6 py-4 text-center font-heading font-bold text-lg">
                  {fighter.wins}-{fighter.losses}-{fighter.draws}
                </td>
                <td className="px-6 py-4 text-center font-heading">
                  {fighter.player.initial_elo_rating && (
                    <div className={`font-bold text-2xl ${
                      (fighter.player.elo_rating - fighter.player.initial_elo_rating) >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {(fighter.player.elo_rating - fighter.player.initial_elo_rating) >= 0 ? '+' : ''}
                      {Math.round(fighter.player.elo_rating - fighter.player.initial_elo_rating)}
                    </div>
                  )}
                  <div className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                    ({Math.round(fighter.player.elo_rating)})
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                  {fighter.player.bjj_belt_rank || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {fighters.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No fighters with completed matches yet
        </div>
      )}
    </div>
  );
}
