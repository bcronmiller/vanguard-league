'use client';

import { use, useState, useEffect } from 'react';

interface Event {
  id: number;
  name: string;
  date: string;
  venue: string;
  status: string;
  fighter_arrival_time: string | null;
  event_start_time: string | null;
}

interface Standing {
  rank: number;
  player_id: number;
  player_name: string;
  photo_url: string | null;
  belt_rank: string | null;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  elo_rating: number;
}

interface LadderResponse {
  event_id: number;
  event_name: string;
  event_date: string;
  standings: Standing[];
}

// Map event IDs to YouTube video IDs
const EVENT_VIDEOS: { [key: number]: string } = {
  1: 'ieFtMnoWqZk', // VGL 1
  // Add more events and their YouTube video IDs here
};

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [ladder, setLadder] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
    loadLadder();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
      const endpoint = isStatic ? `/data/event-${eventId}.json` : `${config.apiUrl}/api/events/${eventId}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      }
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLadder = async () => {
    try {
      const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
      const endpoint = isStatic ? `/data/ladder-event-${eventId}.json` : `${config.apiUrl}/api/ladder/${eventId}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data: LadderResponse = await res.json();
        setLadder(data.standings || []);
      }
    } catch (error) {
      console.error('Failed to load ladder:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;

    // Parse time string (HH:MM:SS format from API)
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);

    // Convert to 12-hour format
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minutes} ${period}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-mbjj-dark">
        <div className="text-2xl font-heading text-gray-600 dark:text-gray-400">LOADING...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-mbjj-dark">
        <div className="text-2xl font-heading text-gray-600 dark:text-gray-400">Event not found</div>
      </div>
    );
  }

  const videoId = EVENT_VIDEOS[eventId];

  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      {/* Header */}
      <header className="bg-mbjj-dark text-white py-6">
        <div className="container mx-auto px-4">
          <a href="/" className="text-mbjj-red hover:text-mbjj-accent-light inline-block mb-4">
            ← Home
          </a>
          <h1 className="text-4xl md:text-5xl font-heading font-bold">EVENT DETAILS</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Event Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8 border-t-4 border-mbjj-red">
          <h2 className="text-4xl font-heading font-bold mb-4 text-gray-900 dark:text-white">
            {event.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-lg">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Date:</span>{' '}
              <span className="font-bold">{formatDate(event.date)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Venue:</span>{' '}
              <span className="font-bold">{event.venue}</span>
            </div>
            {event.fighter_arrival_time && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Fighter Check-In:</span>{' '}
                <span className="font-bold">{formatTime(event.fighter_arrival_time)}</span>
              </div>
            )}
            {event.event_start_time && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Event Start:</span>{' '}
                <span className="font-bold">{formatTime(event.event_start_time)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Section */}
        {videoId && (
          <div className="mb-8">
            <h3 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
              EVENT VIDEO
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg border-t-4 border-mbjj-red">
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={event.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

        {/* Event Results/Ladder */}
        {ladder.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border-t-4 border-mbjj-blue">
            <h3 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
              FINAL STANDINGS
            </h3>
            <div className="space-y-4">
              {ladder.map((standing) => (
                <div
                  key={standing.player_id}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-16 text-center">
                    <span className="text-3xl font-heading font-bold text-mbjj-red">
                      #{standing.rank}
                    </span>
                  </div>

                  {/* Fighter Photo */}
                  {standing.photo_url ? (
                    <img
                      src={standing.photo_url}
                      alt={standing.player_name}
                      className="w-16 h-16 rounded-full border-2 border-mbjj-red object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center border-2 border-mbjj-red">
                      <span className="text-2xl">👤</span>
                    </div>
                  )}

                  {/* Fighter Info */}
                  <div className="flex-1">
                    <a
                      href={`/players/${standing.player_id}`}
                      className="font-heading font-bold text-xl text-gray-900 dark:text-white hover:text-mbjj-red transition"
                    >
                      {standing.player_name.replace('*', '')}
                    </a>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {standing.belt_rank || 'Unknown'} Belt
                    </div>
                  </div>

                  {/* Record */}
                  <div className="text-right">
                    <div className="text-2xl font-heading font-bold">
                      {standing.wins}-{standing.losses}-{standing.draws}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      W-L-D
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results Yet */}
        {ladder.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border-t-4 border-gray-400">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Results will be posted after the event concludes
            </p>
          </div>
        )}
      </main>

      <footer className="bg-mbjj-dark text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="font-heading text-lg mb-2">VANGUARD LEAGUE</p>
          <p className="text-gray-400">Hosted at VanGuard Gym</p>
          <p className="text-gray-500 text-sm mt-4">&copy; 2025 Vanguard League. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
