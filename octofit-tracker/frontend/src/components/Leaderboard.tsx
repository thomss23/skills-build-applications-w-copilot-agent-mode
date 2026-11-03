import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard');
        if (!active) return;
        setEntries(payload.leaderboard ?? []);
        setError(null);
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load leaderboard.');
        setEntries([]);
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
    return <CapabilityCard title="Leaderboard" description="Compare team point totals." status={<p role="status">Loading leaderboard...</p>} />;
  }

  if (error) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals." status={<div role="alert">{error}</div>} />;
  }

  if (entries.length === 0) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals." status={<p role="status">No leaderboard available.</p>} />;
  }

  return <CapabilityCard title="Leaderboard" description="Compare team point totals."><ol>{entries.map((entry, index) => <li key={`${entry.teamName ?? 'team'}-${index}`}>{entry.teamName ?? 'Team'} · {entry.totalPoints ?? 0} pts · #{entry.rank ?? index + 1}</li>)}</ol></CapabilityCard>;
}
