import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function createHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function normalizeObjectId(value: unknown) {
  if (typeof value !== 'string') return null;
  return value.trim() || null;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const userId = normalizeObjectId(body.userId);
  const teamId = normalizeObjectId(body.teamId);
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const minutesValue = Number(body.minutes);

  if (!userId || !teamId || !type || !Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw createHttpError('Activity requires userId, teamId, type, and minutes.', 400);
  }

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw createHttpError('Activity references must be valid Mongo ObjectIds.', 400);
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);

  if (!user) {
    throw createHttpError('User not found for activity.', 404);
  }

  if (!team) {
    throw createHttpError('Team not found for activity.', 404);
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes: minutesValue,
    points: Math.max(1, Math.round(minutesValue)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : '';
  const rawMembers = Array.isArray(body.members) ? body.members : [];

  if (!name) {
    throw createHttpError('Team name is required.', 400);
  }

  if (!mascot) {
    throw createHttpError('Team mascot is required.', 400);
  }

  const members = rawMembers
    .map((member) => (typeof member === 'string' ? member.trim() : ''))
    .filter(Boolean)
    .filter((member) => mongoose.isValidObjectId(member));

  const team = await Team.create({
    name,
    mascot,
    members: members.map((member) => new mongoose.Types.ObjectId(member)),
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = decodeURIComponent(userEmail ?? '').trim();
  const user = await User.findOne({ email }).lean();

  if (!user) {
    throw createHttpError('User not found for workout suggestions.', 404);
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const preferredFocus = typeof user.fitnessGoal === 'string' && user.fitnessGoal.trim()
    ? user.fitnessGoal.trim().toLowerCase()
    : recentActivities[0]?.type?.trim().toLowerCase() ?? '';

  const workouts = await Workout.find().sort({ minutes: 1 }).lean();
  const matching = workouts.filter((workout) => {
    const focus = typeof workout.focus === 'string' ? workout.focus.toLowerCase() : '';
    return !preferredFocus || focus === preferredFocus || focus.includes(preferredFocus) || preferredFocus.includes(focus);
  });

  const suggestions = (matching.length ? matching : workouts).map((workout) => ({
    title: workout.title,
    focus: workout.focus,
    minutes: workout.minutes,
    difficulty: workout.difficulty,
    reason: recentActivities[0]
      ? `Your recent ${recentActivities[0].type} activity and ${preferredFocus || 'current goal'} focus make this a strong match.`
      : `This recommendation supports your ${preferredFocus || 'fitness'} goal.`,
  }));

  return suggestions;
}

export { User };
