'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';

export default function RegisterFighter() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    bjj_belt_rank: 'Blue',
    weight: '',
    age: '',
    academy: 'VanGuard Gym'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if in read-only mode
  useEffect(() => {
    if (config.readOnly) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data
      const playerData = {
        name: formData.name,
        bjj_belt_rank: formData.bjj_belt_rank,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        age: formData.age ? parseInt(formData.age) : null,
        academy: formData.academy,
        active: true
      };

      const response = await fetch('${config.apiUrl}/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      });

      if (response.ok) {
        const player = await response.json();
        setSuccess(`${player.name} registered successfully!`);

        // Reset form
        setFormData({
          name: '',
          bjj_belt_rank: 'Blue',
          weight: '',
          age: '',
          academy: 'VanGuard Gym'
        });

        // Redirect to players page after 2 seconds
        setTimeout(() => {
          router.push('/players');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to register fighter');
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
          </div>
          <h1 className="text-4xl font-heading font-bold">REGISTER NEW FIGHTER</h1>
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
                placeholder="Full Name"
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
                placeholder="165.5"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Weight classes: Lightweight (&lt;170), Middleweight (170-185), Heavyweight (&gt;185)
              </p>
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
                placeholder="25"
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
                placeholder="VanGuard Gym"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-mbjj-red hover:bg-mbjj-accent-light text-white font-heading font-bold py-4 px-6 rounded-lg text-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'REGISTERING...' : 'REGISTER FIGHTER'}
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              * Required fields
            </p>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h2 className="font-heading font-bold text-xl mb-3 text-gray-900 dark:text-white">INSTRUCTIONS</h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• <strong>Name</strong>: Enter fighter's full name</li>
            <li>• <strong>Belt Rank</strong>: Select current BJJ belt rank (determines starting ELO rating)</li>
            <li>• <strong>Weight</strong>: Optional - can be updated during check-in</li>
            <li>• <strong>Age</strong>: Optional - for fighter profile</li>
            <li>• <strong>Academy</strong>: Defaults to VanGuard Gym, change if needed</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
