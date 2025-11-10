'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [venue, setVenue] = useState('VGI Trench');
  const [status, setStatus] = useState('registration_open');
  const [fighterArrivalTime, setFighterArrivalTime] = useState('19:30');
  const [eventStartTime, setEventStartTime] = useState('20:00');
  const [saving, setSaving] = useState(false);

  // Redirect if in read-only mode
  useEffect(() => {
    if (config.readOnly) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !date) {
      alert('Please fill in all required fields');
      return;
    }

    // Combine date and time
    const dateTime = new Date(`${date}T${time}`);

    setSaving(true);
    try {
      const res = await fetch('http://192.168.1.246:8000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          date: dateTime.toISOString(),
          venue,
          status,
          fighter_arrival_time: fighterArrivalTime,
          event_start_time: eventStartTime
        })
      });

      if (res.ok) {
        const event = await res.json();
        alert('Event created successfully!');
        window.location.href = `/events/${event.id}/checkin`;
      } else {
        const error = await res.json();
        alert(`Failed to create event: ${error.detail}`);
      }
    } catch (error) {
      console.error('Create event error:', error);
      alert('Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      <header className="bg-mbjj-dark text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 mb-3">
            <a href="/" className="text-mbjj-red hover:text-mbjj-accent-light">
              ← Home
            </a>
            <span className="text-gray-600">|</span>
            <a href="/events" className="text-mbjj-red hover:text-mbjj-accent-light">
              ← Events
            </a>
          </div>
          <h1 className="text-4xl font-heading font-bold">CREATE NEW EVENT</h1>
          <p className="text-gray-300 mt-2">Set up a new VGI Trench competition</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <label className="block text-lg font-heading font-bold mb-3">
              EVENT NAME *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., VGI Trench - November 14, 2025"
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg"
              required
            />
          </div>

          {/* Date and Time */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <label className="block text-lg font-heading font-bold mb-3">
              DATE & TIME *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg"
                  required
                />
              </div>
            </div>
          </div>

          {/* Event Timing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <label className="block text-lg font-heading font-bold mb-3">
              EVENT TIMING
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Fighter Check-In</label>
                <input
                  type="time"
                  value={fighterArrivalTime}
                  onChange={(e) => setFighterArrivalTime(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Event Start</label>
                <input
                  type="time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg"
                />
              </div>
            </div>
          </div>

          {/* Venue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <label className="block text-lg font-heading font-bold mb-3">
              VENUE
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg"
            />
          </div>

          {/* Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <label className="block text-lg font-heading font-bold mb-3">
              STATUS
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg font-bold"
            >
              <option value="upcoming">Upcoming</option>
              <option value="registration_open">Registration Open</option>
              <option value="check_in">Check-In</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-8 py-4 bg-mbjj-red hover:bg-mbjj-accent-hover text-white font-heading font-bold text-xl rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'CREATING...' : 'CREATE EVENT'}
            </button>
            <a
              href="/events"
              className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white font-heading font-bold text-xl rounded-lg transition text-center"
            >
              CANCEL
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}
