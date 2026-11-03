import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name?: string;
  mascot?: string;
  members?: Array<string | { toString?: () => string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await getJson<{ teams?: TeamRecord[] }>('/api/teams');
        if (!active) return;
        setTeams(payload.teams ?? []);
        setError(null);
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load teams.');
        setTeams([]);
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
    return <CapabilityCard title="Teams" description="Manage teams and members." status={<p role="status">Loading teams...</p>} />;
  }

  if (error) {
    return <CapabilityCard title="Teams" description="Manage teams and members." status={<div role="alert">{error}</div>} />;
  }

  if (teams.length === 0) {
    return <CapabilityCard title="Teams" description="Manage teams and members." status={<p role="status">No teams yet.</p>} />;
  }

  return <CapabilityCard title="Teams" description="Manage teams and members."><ul>{teams.map((team, index) => <li key={`${team.name ?? 'team'}-${index}`}><strong>{team.name ?? 'Team'}</strong> · {team.mascot ?? 'Mascot'} · {team.members?.length ?? 0} members</li>)}</ul></CapabilityCard>;
}
