#!/usr/bin/env node

/**
 * Data Export Script for Static Site Generation
 *
 * Fetches all data from the local API and saves it to JSON files
 * that can be bundled with the static site build.
 *
 * Run this before building for deployment:
 * node scripts/export-data.js
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function fetchAndSave(endpoint, filename) {
  try {
    console.log(`Fetching ${endpoint}...`);
    const response = await fetch(`${API_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const filepath = path.join(DATA_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✓ Saved ${filename} (${JSON.stringify(data).length} bytes)`);

    return data;
  } catch (error) {
    console.error(`✗ Failed to fetch ${endpoint}:`, error.message);
    return null;
  }
}

async function exportData() {
  console.log('\n=== Exporting Vanguard League Data ===\n');
  console.log(`API URL: ${API_URL}\n`);

  // Fetch all endpoints
  const events = await fetchAndSave('/api/events', 'events.json');
  const players = await fetchAndSave('/api/players', 'players.json');
  const overallLadder = await fetchAndSave('/api/ladder/overall', 'ladder-overall.json');

  // Fetch overall weight class ladders (used by homepage)
  await fetchAndSave('/api/ladder/weight-class/Lightweight', 'ladder-lightweight.json');
  await fetchAndSave('/api/ladder/weight-class/Middleweight', 'ladder-middleweight.json');
  await fetchAndSave('/api/ladder/weight-class/Heavyweight', 'ladder-heavyweight.json');

  // Fetch individual event data and weight class ladders
  if (events && events.length > 0) {
    for (const event of events) {
      await fetchAndSave(`/api/events/${event.id}`, `event-${event.id}.json`);
      await fetchAndSave(`/api/events/${event.id}/matches`, `matches-event-${event.id}.json`);
      await fetchAndSave(`/api/ladder/${event.id}`, `ladder-event-${event.id}.json`);

      // Weight class ladders per event
      await fetchAndSave(`/api/ladder/${event.id}/weight-class/Lightweight`, `ladder-event-${event.id}-lightweight.json`);
      await fetchAndSave(`/api/ladder/${event.id}/weight-class/Middleweight`, `ladder-event-${event.id}-middleweight.json`);
      await fetchAndSave(`/api/ladder/${event.id}/weight-class/Heavyweight`, `ladder-event-${event.id}-heavyweight.json`);
    }
  }

  // Fetch individual player data with match history
  if (players && players.length > 0) {
    for (const player of players) {
      // Fetch player info
      const playerData = await fetchAndSave(`/api/players/${player.id}`, `player-${player.id}.json`);

      // Fetch match history, badges, and divisions separately
      if (playerData) {
        try {
          console.log(`Fetching matches for player ${player.id}...`);
          const matchesResponse = await fetch(`${API_URL}/api/players/${player.id}/matches`);

          console.log(`Fetching badges for player ${player.id}...`);
          const badgesResponse = await fetch(`${API_URL}/api/players/${player.id}/badges`);

          console.log(`Fetching divisions for player ${player.id}...`);
          const divisionsResponse = await fetch(`${API_URL}/api/players/${player.id}/divisions`);

          let matches = [];
          let badges = [];
          let divisions = null;

          if (matchesResponse.ok) {
            matches = await matchesResponse.json();
          }

          if (badgesResponse.ok) {
            badges = await badgesResponse.json();
          }

          if (divisionsResponse.ok) {
            divisions = await divisionsResponse.json();
          }

          // Combine player data with matches, badges, and divisions
          const combinedData = {
            ...playerData,
            matches: matches,
            badges: badges,
            divisions: divisions
          };

          const filepath = path.join(DATA_DIR, `player-${player.id}.json`);
          fs.writeFileSync(filepath, JSON.stringify(combinedData, null, 2));
          console.log(`✓ Updated player-${player.id}.json with ${matches.length} matches, ${badges.length} badges, and division stats`);
        } catch (error) {
          console.error(`✗ Failed to fetch data for player ${player.id}:`, error.message);
        }
      }
    }
  }

  console.log('\n=== Export Complete ===\n');
  console.log(`Data exported to: ${DATA_DIR}`);
  console.log('\nYou can now build the static site with: npm run build\n');
}

// Run export
exportData().catch(error => {
  console.error('\n=== Export Failed ===\n');
  console.error(error);
  process.exit(1);
});
