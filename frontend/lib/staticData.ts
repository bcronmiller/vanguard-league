/**
 * Static Data Layer
 *
 * Provides a unified interface for fetching data that works in both:
 * 1. Development mode (fetches from API)
 * 2. Static export mode (reads from JSON files)
 */

const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.246:8000';

/**
 * Fetch data from API or static JSON files
 */
async function fetchData(endpoint: string, staticFilename: string) {
  if (IS_STATIC) {
    // In static mode, read from public/data/*.json files
    const response = await fetch(`/data/${staticFilename}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load static data: ${staticFilename}`);
    }
    return response.json();
  } else {
    // In development, fetch from API
    const response = await fetch(`${API_URL}${endpoint}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`API request failed: ${endpoint}`);
    }
    return response.json();
  }
}

export const staticData = {
  // Events
  async getEvents() {
    return fetchData('/api/events', 'events.json');
  },

  async getEvent(id: number) {
    return fetchData(`/api/events/${id}`, `event-${id}.json`);
  },

  // Players
  async getPlayers() {
    return fetchData('/api/players', 'players.json');
  },

  async getPlayer(id: number) {
    return fetchData(`/api/players/${id}`, `player-${id}.json`);
  },

  // Ladder
  async getOverallLadder() {
    return fetchData('/api/ladder/overall', 'ladder-overall.json');
  },

  async getEventLadder(eventId: number) {
    return fetchData(`/api/ladder/${eventId}`, `ladder-event-${eventId}.json`);
  },

  async getWeightClassLadder(weightClass: string) {
    const filename = `ladder-${weightClass.toLowerCase()}.json`;
    return fetchData(`/api/ladder/overall/weight-class/${weightClass}`, filename);
  },
};

export const isStaticMode = () => IS_STATIC;
export const getApiUrl = () => API_URL;
