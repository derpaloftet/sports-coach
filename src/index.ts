import 'dotenv/config';
import { IntervalsClient } from './integrations/intervals.js';

function getConfig() {
  const athleteId = process.env.INTERVALS_ATHLETE_ID;
  const apiKey = process.env.INTERVALS_API_KEY;

  if (!athleteId || !apiKey) {
    throw new Error('Missing INTERVALS_ATHLETE_ID or INTERVALS_API_KEY in .env');
  }

  return {
    intervals: { athleteId, apiKey },
  };
}

async function main() {
  const config = getConfig();
  const intervals = new IntervalsClient(config.intervals);

  // Fetch activities from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const oldestDate = thirtyDaysAgo.toISOString().split('T')[0];

  console.log(`Fetching activities since ${oldestDate}...`);
  const activities = await intervals.getActivities(oldestDate);
  console.log(`Total activities: ${activities.length}`);

  // Filter to runs, rides, and weight training
  const filtered = intervals.filterActivities(activities);
  console.log(`Filtered activities (run/ride/weight): ${filtered.length}`);

  // Convert to compact format for LLM
  const compact = intervals.toCompactActivities(filtered);
  console.log('\nCompact activities for LLM:');
  console.log(JSON.stringify(compact, null, 2));

  // Fetch today's wellness (CTL/ATL/TSB)
  const today = new Date().toISOString().split('T')[0];
  console.log(`\nFetching wellness for ${today}...`);
  const wellness = await intervals.getWellness(today);
  if (wellness) {
    console.log('Wellness:', wellness);
  } else {
    console.log('No wellness data for today');
  }
}

main().catch(console.error);
