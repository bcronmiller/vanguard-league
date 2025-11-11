'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';

interface Event {
  id: number;
  name: string;
  date: string;
  venue: string;
  status: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Redirect if in read-only mode
  useEffect(() => {
    if (config.readOnly) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/api/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
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
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gray-500';
      case 'in_progress': return 'bg-green-500';
      case 'check_in': return 'bg-blue-500';
      case 'registration_open': return 'bg-yellow-500';
      case 'upcoming': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const handleDeleteEvent = async (eventId: number) => {
    setDeleting(true);
    try {
      const res = await fetch(`${config.apiUrl}/api/events/${eventId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        const result = await res.json();
        console.log('Event deleted:', result);
        // Reload events list
        await loadEvents();
        setDeleteConfirm(null);
      } else {
        alert('Failed to delete event');
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleRecalculateRankings = async () => {
    if (!confirm('Recalculate all fighter rankings based on match results? This will update ELO ratings for all fighters.')) {
      return;
    }

    setRecalculating(true);
    try {
      const res = await fetch(`${config.apiUrl}/api/recalculate-elo`, {
        method: 'POST'
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Rankings updated!\n\nProcessed ${result.matches_processed} matches\nUpdated ${result.fighters_updated} fighters`);
      } else {
        alert('Failed to recalculate rankings');
      }
    } catch (error) {
      console.error('Failed to recalculate rankings:', error);
      alert('Failed to recalculate rankings');
    } finally {
      setRecalculating(false);
    }
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
      <header className="bg-mbjj-dark text-white py-6">
        <div className="container mx-auto px-4">
          <a href="/" className="text-mbjj-red hover:text-mbjj-accent-light inline-block mb-3">
            ← Home
          </a>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-heading font-bold">EVENTS</h1>
              <p className="text-gray-300 mt-2">Manage VGI Trench Competitions</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleRecalculateRankings}
                disabled={recalculating}
                className="px-8 py-4 bg-mbjj-blue hover:bg-blue-600 text-white font-heading font-bold text-lg rounded-lg transition disabled:opacity-50"
              >
                {recalculating ? 'UPDATING...' : '🔄 UPDATE RANKINGS'}
              </button>
              <a
                href="/events/new"
                className="px-8 py-4 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-lg rounded-lg transition"
              >
                + CREATE NEW EVENT
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {events.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
            <h2 className="text-3xl font-heading font-bold mb-4">NO EVENTS YET</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Create your first event to get started
            </p>
            <a
              href="/events/new"
              className="inline-block px-8 py-4 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-lg rounded-lg transition"
            >
              + CREATE EVENT
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border-l-4 border-mbjj-red hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                        {event.name}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${getStatusColor(event.status)}`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </div>
                    <div className="flex gap-6 text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-bold">📅</span> {formatDate(event.date)}
                      </div>
                      <div>
                        <span className="font-bold">📍</span> {event.venue}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={`/events/${event.id}/checkin`}
                      className="px-6 py-3 bg-mbjj-blue hover:bg-blue-600 text-white font-heading font-bold rounded-lg transition"
                    >
                      CHECK-IN
                    </a>
                    <a
                      href={`/events/${event.id}/brackets`}
                      className="px-6 py-3 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold rounded-lg transition"
                    >
                      BRACKETS
                    </a>
                    <button
                      onClick={() => setDeleteConfirm(event.id)}
                      className="px-6 py-3 bg-gray-500 hover:bg-red-600 text-white font-heading font-bold rounded-lg transition"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-heading font-bold mb-4 text-gray-900 dark:text-white">
              ⚠️ DELETE EVENT?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              This will permanently delete <strong>{events.find(e => e.id === deleteConfirm)?.name}</strong> and remove:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li>All matches from this event</li>
              <li>All check-ins for this event</li>
              <li>All weigh-in records</li>
            </ul>
            <p className="text-sm text-red-600 dark:text-red-400 mb-6 font-bold">
              ⚠️ This action cannot be undone!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Note: Fighter profiles will NOT be deleted, only their participation in this event.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-heading font-bold rounded-lg transition disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleDeleteEvent(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-heading font-bold rounded-lg transition disabled:opacity-50"
              >
                {deleting ? 'DELETING...' : 'DELETE EVENT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
