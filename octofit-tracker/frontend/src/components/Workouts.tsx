import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await getJson<{ suggestions?: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (!active) return;
        setSuggestions(payload.suggestions ?? []);
        setError(null);
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load workout suggestions.');
        setSuggestions([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." status={<p role="status">Loading workout suggestions...</p>} />;
  }

  if (error) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." status={<div role="alert">{error}</div>} />;
  }

  if (suggestions.length === 0) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." status={<p role="status">No workout suggestions available.</p>} />;
  }

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><ul>{suggestions.map((suggestion, index) => <li key={`${suggestion.title ?? 'workout'}-${index}`}><strong>{suggestion.title ?? 'Workout'}</strong> · {suggestion.focus ?? 'focus'} · {suggestion.reason ?? 'Recommended for your goal'}</li>)}</ul></CapabilityCard>;
}
