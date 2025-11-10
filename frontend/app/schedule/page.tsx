'use client';

import { useState, useEffect } from 'react';

interface Event {
  id: number;
  name: string;
  date: string;
  venue: string;
  status: string;
  fighter_arrival_time: string | null;
  event_start_time: string | null;
}

// Map event IDs to YouTube video IDs
const EVENT_VIDEOS: { [key: number]: string } = {
  1: 'ieFtMnoWqZk', // VGL 1
  // Add more events and their YouTube video IDs here
};

export default function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const isStatic = process.env.NEXT_PUBLIC_STATIC_MODE === 'true';
      const endpoint = isStatic ? '/data/events.json' : 'http://192.168.1.246:8000/api/events';

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const now = new Date();

        // Separate upcoming and past events
        const upcoming = data.filter((e: Event) => new Date(e.date) >= now);
        const past = data.filter((e: Event) => new Date(e.date) < now);

        // Sort upcoming by date ascending (soonest first)
        upcoming.sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Sort past by date descending (most recent first)
        past.sort((a: Event, b: Event) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setUpcomingEvents(upcoming);
        setPastEvents(past);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { text: string; color: string } } = {
      completed: { text: 'COMPLETED', color: 'bg-green-600' },
      in_progress: { text: 'IN PROGRESS', color: 'bg-blue-600' },
      registration_open: { text: 'UPCOMING', color: 'bg-yellow-600' },
    };
    return badges[status] || { text: status.toUpperCase(), color: 'bg-gray-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-mbjj-dark">
        <div className="text-2xl font-heading text-gray-600 dark:text-gray-400">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      {/* Header */}
      <header className="bg-mbjj-dark text-white py-8">
        <div className="container mx-auto px-4">
          <a href="/" className="text-mbjj-red hover:text-mbjj-accent-light inline-block mb-4">
            ← Home
          </a>
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-2">
              EVENTS
            </h1>
            <div className="h-1 w-32 bg-mbjj-red mx-auto mb-4"></div>
            <p className="text-xl md:text-2xl font-heading text-gray-300">
              VANGUARD LEAGUE SCHEDULE
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
            <p className="text-2xl text-gray-600 dark:text-gray-400">
              No events yet. Check back soon!
            </p>
          </div>
        ) : (
          <>
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <section className="mb-12">
                <h2 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
                  UPCOMING EVENTS
                </h2>
                <div className="grid gap-6">
                  {upcomingEvents.map((event) => {
                    const hasVideo = EVENT_VIDEOS[event.id];
                    const badge = getStatusBadge(event.status);

                    return (
                      <a
                        key={event.id}
                        href={`/events/${event.id}`}
                        className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition border-t-4 border-mbjj-blue group"
                      >
                        <div className="p-8">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h3 className="text-3xl font-heading font-bold mb-2 text-gray-900 dark:text-white group-hover:text-mbjj-blue transition">
                                {event.name}
                              </h3>
                              <div className="flex flex-wrap gap-4 text-lg text-gray-600 dark:text-gray-400">
                                <div>
                                  <span className="font-bold">📅</span> {formatDate(event.date)}
                                </div>
                                <div>
                                  <span className="font-bold">📍</span> {event.venue}
                                </div>
                                {event.fighter_arrival_time && (
                                  <div>
                                    <span className="font-bold">🥋</span> Fighters: {formatTime(event.fighter_arrival_time)}
                                  </div>
                                )}
                                {event.event_start_time && (
                                  <div>
                                    <span className="font-bold">🔔</span> Start: {formatTime(event.event_start_time)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className={`${badge.color} text-white px-4 py-2 rounded-lg font-heading font-bold text-sm`}>
                                {badge.text}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 text-mbjj-blue font-heading font-bold group-hover:underline">
                            VIEW EVENT DETAILS →
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <section>
                <h2 className="text-3xl font-heading font-bold mb-6 text-gray-900 dark:text-white">
                  PAST EVENTS
                </h2>
                <div className="grid gap-6">
                  {pastEvents.map((event) => {
                    const hasVideo = EVENT_VIDEOS[event.id];
                    const badge = getStatusBadge(event.status);

                    return (
                      <a
                        key={event.id}
                        href={`/events/${event.id}`}
                        className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition border-t-4 border-mbjj-red group"
                      >
                        <div className="p-8">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h3 className="text-3xl font-heading font-bold mb-2 text-gray-900 dark:text-white group-hover:text-mbjj-red transition">
                                {event.name}
                              </h3>
                              <div className="flex flex-wrap gap-4 text-lg text-gray-600 dark:text-gray-400">
                                <div>
                                  <span className="font-bold">📅</span> {formatDate(event.date)}
                                </div>
                                <div>
                                  <span className="font-bold">📍</span> {event.venue}
                                </div>
                                {event.fighter_arrival_time && (
                                  <div>
                                    <span className="font-bold">🥋</span> Fighters: {formatTime(event.fighter_arrival_time)}
                                  </div>
                                )}
                                {event.event_start_time && (
                                  <div>
                                    <span className="font-bold">🔔</span> Start: {formatTime(event.event_start_time)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className={`${badge.color} text-white px-4 py-2 rounded-lg font-heading font-bold text-sm`}>
                                {badge.text}
                              </span>
                            </div>
                          </div>

                          {/* Video Badge */}
                          {hasVideo && (
                            <div className="mt-4 flex items-center gap-2 text-mbjj-red">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                              <span className="font-heading font-bold">VIDEO AVAILABLE</span>
                            </div>
                          )}

                          <div className="mt-4 text-mbjj-blue font-heading font-bold group-hover:underline">
                            VIEW EVENT DETAILS →
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="bg-mbjj-dark text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="font-heading text-lg mb-2">VANGUARD LEAGUE</p>
          <p className="text-gray-400">Hosted at VanGuard Gym</p>
          <p className="text-gray-500 text-sm mt-4">&copy; 2025 Vanguard Grappling Institute. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
