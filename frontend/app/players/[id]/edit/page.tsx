'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';

interface Player {
  id: number;
  name: string;
  bjj_belt_rank: string | null;
  age: number | null;
  weight: number | null;
  academy: string | null;
  photo_url: string | null;
}

export default function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const playerId = resolvedParams.id;
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    bjj_belt_rank: 'Blue',
    weight: '',
    age: '',
    academy: 'VanGuard Gym',
    photo_url: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if in read-only mode
  useEffect(() => {
    if (config.readOnly) {
      router.push(`/players/${playerId}`);
    }
  }, [playerId, router]);

  useEffect(() => {
    loadPlayer();
  }, [playerId]);

  const loadPlayer = async () => {
    try {
      const res = await fetch(`http://192.168.1.246:8000/api/players/${playerId}`);
      if (res.ok) {
        const player: Player = await res.json();
        setFormData({
          name: player.name,
          bjj_belt_rank: player.bjj_belt_rank || 'Blue',
          weight: player.weight?.toString() || '',
          age: player.age?.toString() || '',
          academy: player.academy || 'VanGuard Gym',
          photo_url: player.photo_url || ''
        });
      } else {
        setError('Failed to load player');
      }
    } catch (error) {
      console.error('Failed to load player:', error);
      setError('Failed to load player');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const playerData = {
        name: formData.name,
        bjj_belt_rank: formData.bjj_belt_rank,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        age: formData.age ? parseInt(formData.age) : null,
        academy: formData.academy,
        photo_url: formData.photo_url || null
      };

      const response = await fetch(`http://192.168.1.246:8000/api/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          router.push(`/players/${playerId}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-mbjj-dark">
        <div className="text-2xl font-heading text-gray-600 dark:text-gray-400">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-mbjj-dark">
      {/* Header */}
      <header className="bg-mbjj-dark text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 mb-3">
            <a href="/" className="text-mbjj-red hover:text-mbjj-accent-light">
              ← Home
            </a>
            <span className="text-gray-600">|</span>
            <a href="/players" className="text-mbjj-red hover:text-mbjj-accent-light">
              Players
            </a>
            <span className="text-gray-600">|</span>
            <a href={`/players/${playerId}`} className="text-mbjj-red hover:text-mbjj-accent-light">
              Profile
            </a>
          </div>
          <h1 className="text-4xl font-heading font-bold">EDIT FIGHTER PROFILE</h1>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-heading font-bold mb-2 text-gray-900 dark:text-white">
                FIGHTER NAME *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mbjj-red focus:outline-none text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>

            {/* Belt Rank */}
            <div>
              <label htmlFor="bjj_belt_rank" className="block text-sm font-heading font-bold mb-2 text-gray-900 dark:text-white">
                BJJ BELT RANK *
              </label>
              <select
                id="bjj_belt_rank"
                name="bjj_belt_rank"
                required
                value={formData.bjj_belt_rank}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mbjj-red focus:outline-none text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="White">White</option>
                <option value="Blue">Blue</option>
                <option value="Purple">Purple</option>
                <option value="Brown">Brown</option>
                <option value="Black">Black</option>
              </select>
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm font-heading font-bold mb-2 text-gray-900 dark:text-white">
                WEIGHT (lbs)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                step="0.1"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mbjj-red focus:outline-none text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-heading font-bold mb-2 text-gray-900 dark:text-white">
                AGE
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mbjj-red focus:outline-none text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>

            {/* Academy */}
            <div>
              <label htmlFor="academy" className="block text-sm font-heading font-bold mb-2 text-gray-900 dark:text-white">
                ACADEMY/GYM
              </label>
              <input
                type="text"
                id="academy"
                name="academy"
                value={formData.academy}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mbjj-red focus:outline-none text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>

            {/* Photo URL */}
            <div>
              <label htmlFor="photo_url" className="block text-sm font-heading font-bold mb-2 text-gray-900 dark:text-white">
                PHOTO URL
              </label>
              <input
                type="url"
                id="photo_url"
                name="photo_url"
                value={formData.photo_url}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mbjj-red focus:outline-none text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Leave blank to use default fighter image
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push(`/players/${playerId}`)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-heading font-bold py-4 px-6 rounded-lg text-xl transition"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-mbjj-red hover:bg-mbjj-accent-light text-white font-heading font-bold py-4 px-6 rounded-lg text-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
