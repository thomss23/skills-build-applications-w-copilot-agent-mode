import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await getJson<{ activities?: ActivityRecord[] }>('/api/activities');
        if (!active) return;
        setActivities(payload.activities ?? []);
        setError(null);
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load activities.');
        setActivities([]);
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
    return <CapabilityCard title="Activities" description="Track student activity minutes and points." status={<p role="status">Loading activities...</p>} />;
  }

  if (error) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points." status={<div role="alert">{error}</div>} />;
  }

  if (activities.length === 0) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points." status={<p role="status">No activities yet.</p>} />;
  }

  return <CapabilityCard title="Activities" description="Track student activity minutes and points."><ul>{activities.map((activity, index) => <li key={`${activity.type ?? 'activity'}-${index}`}><strong>{activity.type ?? 'Activity'}</strong> · {activity.minutes ?? 0} minutes · {activity.points ?? 0} pts</li>)}</ul></CapabilityCard>;
}
