import 'dotenv/config';
import { IntervalsClient } from './integrations/intervals.js';
import { NotionClient } from './integrations/notion.js';
import { daysAgo, today, getWeekStart, getWeekNumber, formatWeekRange } from './utils/date.js';

const {
  INTERVALS_ATHLETE_ID,
  INTERVALS_API_KEY,
  NOTION_API_KEY,
  NOTION_PLANS_DB_ID,
  NOTION_CURRENT_PLAN_PAGE_ID,
} = process.env;

if (!INTERVALS_ATHLETE_ID || !INTERVALS_API_KEY) {
  throw new Error('Missing INTERVALS_ATHLETE_ID or INTERVALS_API_KEY');
}
if (!NOTION_API_KEY || !NOTION_PLANS_DB_ID) {
  throw new Error('Missing NOTION_API_KEY or NOTION_PLANS_DB_ID');
}

const intervals = new IntervalsClient({
  athleteId: INTERVALS_ATHLETE_ID,
  apiKey: INTERVALS_API_KEY,
});

const notion = new NotionClient({
  apiKey: NOTION_API_KEY,
  plansDbId: NOTION_PLANS_DB_ID,
  currentPlanPageId: NOTION_CURRENT_PLAN_PAGE_ID,
});

async function main() {
  // Fetch activities and wellness
  console.log('Fetching from Intervals.icu...');
  const [activities, wellness] = await Promise.all([
    intervals.getCompactActivities(daysAgo(30)),
    intervals.getWellness(today()),
  ]);
  console.log(`Activities: ${activities.length}, Wellness: CTL=${wellness?.ctl.toFixed(1)}`);

  // Check for existing plan this week
  const weekStart = getWeekStart();
  const year = new Date(weekStart).getFullYear();
  const weekNum = getWeekNumber(weekStart);
  const planId = `plan-${year}-w${String(weekNum).padStart(2, '0')}`;

  console.log(`\nChecking for plan ${planId}...`);
  let currentPlan = await notion.getPlanByPlanId(planId);

  if (currentPlan) {
    console.log('Found existing plan');
    console.log('Status:', currentPlan.status);

    // Update the current plan page with existing plan content
    const title = `Week ${weekNum}: ${formatWeekRange(weekStart)}`;
    await notion.updatePlan(currentPlan.id, { title, plan: currentPlan.plan });
    console.log('Updated current plan page');
  } else {
    console.log('No plan found. Creating...');

    currentPlan = await notion.createPlan({
      planId,
      title: `Week ${weekNum}: ${formatWeekRange(weekStart)}`,
      weekStart,
      status: 'Planned',
      goal: 'Build Fitness',
      plan: `Mon: Rest or easy 30min ride
Tue: 6km easy run, HR zone 2
Wed: Indoor cycling 45min
Thu: 7km run with 4x30s strides
Fri: Rest
Sat: Gym session
Sun: Long run 10km easy`,
      summary: 'Test plan created by app',
      plannedLoad: 120,
      generatedByAi: true,
      lastUpdated: today(),
    });

    console.log('Created:', currentPlan.planId);
  }
}

main().catch(console.error);
