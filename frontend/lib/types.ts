/**
 * Shared TypeScript types for the Vanguard League Platform
 */

export interface Player {
  id: number;
  name: string;
  bjj_belt_rank: string | null;
  weight: number | null;
  weight_class_name: string | null;
  elo_rating: number;
  initial_elo_rating?: number | null;
  photo_url: string | null;
  academy: string | null;
}

export interface Fighter {
  player: Player;
  wins: number;
  losses: number;
  draws: number;
}

export interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  status: string;
}

export interface LadderStanding {
  player: Player;
  wins: number;
  losses: number;
  draws: number;
  position: number;
}

// Weight class constants
export const WEIGHT_CLASSES = {
  LIGHTWEIGHT: { min: 0, max: 170, name: 'Lightweight' },
  MIDDLEWEIGHT: { min: 170, max: 200, name: 'Middleweight' },
  HEAVYWEIGHT: { min: 200, max: Infinity, name: 'Heavyweight' },
} as const;

export function getWeightClass(weight: number | null): string {
  if (!weight) return 'N/A';
  if (weight < 170) return 'Lightweight';
  if (weight <= 200) return 'Middleweight';
  return 'Heavyweight';
}

// Date formatting utilities
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
