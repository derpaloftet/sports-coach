import 'dotenv/config';
import { IntervalsClient } from './integrations/intervals.js';
import { NotionClient } from './integrations/notion.js';
import { Coach } from './agent/coach.js';
import { daysAgo, today, getWeekStart, getWeekNumber } from './utils/date.js';
import type { CoachInput, RaceGoal } from './types/index.js';

const {
  INTERVALS_ATHLETE_ID,
  INTERVALS_API_KEY,
  ANTHROPIC_API_KEY,
  NOTION_API_KEY,
  NOTION_PLANS_DB_ID,
  NOTION_CURRENT_PLAN_PAGE_ID,
  NOTION_ATHLETE_STATE_PAGE_ID,
} = process.env;

if (!INTERVALS_ATHLETE_ID || !INTERVALS_API_KEY) {
  throw new Error('Missing INTERVALS_ATHLETE_ID or INTERVALS_API_KEY');
}
if (!ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY');
}
if (!NOTION_API_KEY || !NOTION_PLANS_DB_ID) {
  throw new Error('Missing NOTION_API_KEY or NOTION_PLANS_DB_ID');
}

// Race goal
const raceGoal: RaceGoal = {
  date: '2026-03-29',
  event: '10K',
  targetTime: 'sub-50 minutes',
};

// Calculate weeks until race
function getWeeksUntilRace(): { weekNumber: number; totalWeeks: number } {
  const raceDate = new Date(raceGoal.date);
  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksRemaining = Math.ceil((raceDate.getTime() - now.getTime()) / msPerWeek);
  const totalWeeks = 8; // 8 week training block
  const weekNumber = totalWeeks - weeksRemaining + 1;
  return { weekNumber: Math.max(1, Math.min(weekNumber, totalWeeks)), totalWeeks };
}

const intervals = new IntervalsClient({
  athleteId: INTERVALS_ATHLETE_ID,
  apiKey: INTERVALS_API_KEY,
});

const notion = new NotionClient({
  apiKey: NOTION_API_KEY,
  plansDbId: NOTION_PLANS_DB_ID,
  currentPlanPageId: NOTION_CURRENT_PLAN_PAGE_ID,
  athleteStatePageId: NOTION_ATHLETE_STATE_PAGE_ID,
});

const coach = new Coach({
  apiKey: ANTHROPIC_API_KEY,
  notion,
});

async function getCurrentWeekPlan() {
  const weekStart = getWeekStart();
  const year = new Date(weekStart).getFullYear();
  const weekNum = getWeekNumber(weekStart);
  const planId = `plan-${year}-w${String(weekNum).padStart(2, '0')}`;

  console.log(`\nChecking for plan ${planId}...`);
  const plan = await notion.getPlanByPlanId(planId);

  if (plan) {
    console.log('Found existing plan');
    console.log('Status:', plan.status);
    console.log('Goal:', plan.goal);
  } else {
    console.log('No plan found for this week');
  }

  return plan;
}

async function runCoach(input: CoachInput) {
  const { weekNumber, totalWeeks, raceGoal } = input;
  console.log(`\nWeek ${weekNumber} of ${totalWeeks} (Race: ${raceGoal.date})`);

  const result = await coach.run(input);

  console.log('\n--- Coach Summary ---');
  if (result.plan) {
    console.log(`Plan: ${result.plan.title}`);
    console.log(`Goal: ${result.plan.goal}`);
    console.log(`Load: ${result.plan.plannedLoad} TSS`);
  }
  if (result.risks.length > 0) {
    console.log(`\nRisks flagged: ${result.risks.length}`);
    for (const risk of result.risks) {
      console.log(`  - [${risk.severity}] ${risk.risk}: ${risk.message}`);
    }
  }
  if (result.notes.length > 0) {
    console.log(`\nNotes: ${result.notes.length}`);
    for (const note of result.notes) {
      console.log(`  - ${note}`);
    }
  }

  return result;
}

async function main() {
  console.log('Fetching from Intervals.icu...');
  const [athlete, activities, wellness] = await Promise.all([
    intervals.getAthlete(),
    intervals.getCompactActivities(daysAgo(30)),
    intervals.getWellness(today()),
  ]);
  console.log(`Athlete: age=${athlete.age}, maxHR=${athlete.maxHr}, LTHR=${athlete.lthr}, weight=${athlete.weight}kg`);
  console.log(`Activities: ${activities.length}, Wellness: CTL=${wellness?.ctl.toFixed(1)}`);

  if (!wellness) {
    throw new Error('Could not fetch wellness data');
  }

  const currentPlan = await getCurrentWeekPlan();
  const athleteState = await notion.getAthleteState();
  const { weekNumber, totalWeeks } = getWeeksUntilRace();

  if (athleteState) {
    console.log(`\nAthlete state loaded (${athleteState.length} chars)`);
  }

  await runCoach({
    athlete,
    wellness,
    recentActivities: activities,
    currentWeekPlan: currentPlan,
    raceGoal,
    weekNumber,
    totalWeeks,
    athleteState: athleteState ?? undefined,
  });
}

main().catch(console.error);
