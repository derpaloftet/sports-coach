import 'dotenv/config';
import { IntervalsClient } from './integrations/intervals.js';
import { NotionClient } from './integrations/notion.js';
import { daysAgo, today, getWeekStart, getWeekNumber, nowISO } from './utils/date.js';

const {
  INTERVALS_ATHLETE_ID,
  INTERVALS_API_KEY,
  NOTION_API_KEY,
  NOTION_PLANS_DB_ID,
  NOTION_CURRENT_PLAN_PAGE_ID,
  NOTION_ATHLETE_STATE_PAGE_ID,
} = process.env;

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: unknown;
}

async function testIntervalsAthlete(intervals: IntervalsClient): Promise<TestResult> {
  try {
    const athlete = await intervals.getAthlete();
    const valid = athlete.age > 0 && athlete.maxHr > 0 && athlete.lthr > 0;
    return {
      name: 'Intervals.icu: Athlete Profile',
      passed: valid,
      message: valid
        ? `age=${athlete.age}, maxHR=${athlete.maxHr}, LTHR=${athlete.lthr}, weight=${athlete.weight}kg`
        : 'Missing required fields (age, maxHR, or LTHR)',
      data: athlete,
    };
  } catch (error) {
    return { name: 'Intervals.icu: Athlete Profile', passed: false, message: String(error) };
  }
}

async function testIntervalsActivities(intervals: IntervalsClient): Promise<TestResult> {
  try {
    const activities = await intervals.getCompactActivities(daysAgo(30));
    return {
      name: 'Intervals.icu: Activities',
      passed: true,
      message: `Found ${activities.length} activities in last 30 days`,
      data: activities.slice(0, 3), // First 3 as sample
    };
  } catch (error) {
    return { name: 'Intervals.icu: Activities', passed: false, message: String(error) };
  }
}

async function testIntervalsWellness(intervals: IntervalsClient): Promise<TestResult> {
  try {
    const wellness = await intervals.getWellness(today());
    if (!wellness) {
      return { name: 'Intervals.icu: Wellness', passed: false, message: 'No wellness data for today' };
    }
    return {
      name: 'Intervals.icu: Wellness',
      passed: true,
      message: `CTL=${wellness.ctl.toFixed(1)}, ATL=${wellness.atl.toFixed(1)}, TSB=${wellness.tsb.toFixed(1)}`,
      data: wellness,
    };
  } catch (error) {
    return { name: 'Intervals.icu: Wellness', passed: false, message: String(error) };
  }
}

async function testNotionGetPlan(notion: NotionClient): Promise<TestResult> {
  try {
    const weekStart = getWeekStart();
    const year = new Date(weekStart).getFullYear();
    const weekNum = getWeekNumber(weekStart);
    const planId = `plan-${year}-w${String(weekNum).padStart(2, '0')}`;

    const plan = await notion.getPlanByPlanId(planId);
    if (plan) {
      return {
        name: 'Notion: Get Current Week Plan',
        passed: true,
        message: `Found plan "${plan.title}" (${plan.status}, ${plan.goal})`,
        data: { planId: plan.planId, goal: plan.goal, lastUpdated: plan.lastUpdated },
      };
    }
    return {
      name: 'Notion: Get Current Week Plan',
      passed: true,
      message: `No plan exists for ${planId} (this is OK)`,
    };
  } catch (error) {
    return { name: 'Notion: Get Current Week Plan', passed: false, message: String(error) };
  }
}

async function testNotionAthleteState(notion: NotionClient): Promise<TestResult> {
  try {
    const state = await notion.getAthleteState();
    if (state) {
      return {
        name: 'Notion: Athlete State',
        passed: true,
        message: `Loaded ${state.length} chars from My Current State page`,
        data: state.substring(0, 200) + (state.length > 200 ? '...' : ''),
      };
    }
    return {
      name: 'Notion: Athlete State',
      passed: true,
      message: 'No athlete state page configured or page is empty',
    };
  } catch (error) {
    return { name: 'Notion: Athlete State', passed: false, message: String(error) };
  }
}

async function testNotionCreateAndUpdate(notion: NotionClient): Promise<TestResult> {
  const testPlanId = `test-${Date.now()}`;
  try {
    // Create a test plan
    const created = await notion.createPlan({
      planId: testPlanId,
      title: 'Smoke Test Plan',
      weekStart: getWeekStart(),
      status: 'Planned',
      goal: 'Recovery',
      plan: 'Mon: Test\nTue: Test\nWed: Test',
      summary: 'Automated smoke test',
      plannedLoad: 50,
      generatedByAi: true,
      lastUpdated: nowISO(),
    });

    // Verify it was created
    const fetched = await notion.getPlanByPlanId(testPlanId);
    if (!fetched) {
      return {
        name: 'Notion: Create & Fetch Plan',
        passed: false,
        message: 'Plan was created but could not be fetched back',
      };
    }

    // Check lastUpdated has time component
    const hasTime = fetched.lastUpdated.includes('T');

    return {
      name: 'Notion: Create & Fetch Plan',
      passed: true,
      message: `Created plan ${testPlanId}, lastUpdated=${fetched.lastUpdated} (has time: ${hasTime})`,
      data: { id: created.id, planId: created.planId, lastUpdated: fetched.lastUpdated },
    };
  } catch (error) {
    return { name: 'Notion: Create & Fetch Plan', passed: false, message: String(error) };
  }
}

async function runTests() {
  console.log('=== Sport Coach Smoke Tests ===\n');

  // Validate env
  const missing: string[] = [];
  if (!INTERVALS_ATHLETE_ID) missing.push('INTERVALS_ATHLETE_ID');
  if (!INTERVALS_API_KEY) missing.push('INTERVALS_API_KEY');
  if (!NOTION_API_KEY) missing.push('NOTION_API_KEY');
  if (!NOTION_PLANS_DB_ID) missing.push('NOTION_PLANS_DB_ID');

  if (missing.length > 0) {
    console.log(`Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  const intervals = new IntervalsClient({
    athleteId: INTERVALS_ATHLETE_ID!,
    apiKey: INTERVALS_API_KEY!,
  });

  const notion = new NotionClient({
    apiKey: NOTION_API_KEY!,
    plansDbId: NOTION_PLANS_DB_ID!,
    currentPlanPageId: NOTION_CURRENT_PLAN_PAGE_ID,
    athleteStatePageId: NOTION_ATHLETE_STATE_PAGE_ID,
  });

  const results: TestResult[] = [];

  // Run tests
  console.log('Testing Intervals.icu...');
  results.push(await testIntervalsAthlete(intervals));
  results.push(await testIntervalsActivities(intervals));
  results.push(await testIntervalsWellness(intervals));

  console.log('Testing Notion...');
  results.push(await testNotionGetPlan(notion));
  results.push(await testNotionAthleteState(notion));
  results.push(await testNotionCreateAndUpdate(notion));

  // Print results
  console.log('\n=== Results ===\n');
  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const icon = r.passed ? '\u2713' : '\u2717';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.message}`);
    if (r.data && !r.passed) {
      console.log(`  Data: ${JSON.stringify(r.data, null, 2)}`);
    }
    console.log();
    if (r.passed) passed++;
    else failed++;
  }

  console.log(`=== ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
