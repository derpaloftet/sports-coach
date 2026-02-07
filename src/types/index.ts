// Activity from Intervals.icu API
export interface Activity {
  id: string;
  start_date_local: string;
  start_date: string;
  type: string;
  name: string;
  description?: string;
  distance?: number; // meters
  moving_time?: number; // seconds
  elapsed_time?: number; // seconds
  average_speed?: number; // m/s
  max_speed?: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  icu_training_load?: number; // TSS
  icu_intensity?: number;
  icu_rpe?: number; // 1-10
  feel?: number; // 1-5
  icu_hr_zones?: number[];
  icu_hr_zone_times?: number[];
  lthr?: number;
  icu_resting_hr?: number;
  icu_weight?: number;
  athlete_max_hr?: number;
  pace?: number;
  average_stride?: number;
  source?: string;
  interval_summary?: string[]; // e.g. ['2x 14m 113bpm', '1x 7m16s 130bpm']
}

// Wellness data from Intervals.icu
export interface Wellness {
  ctl: number; // Chronic Training Load (fitness)
  atl: number; // Acute Training Load (fatigue)
  tsb: number; // Training Stress Balance (form)
  restingHR?: number;
  weight?: number;
}

// Compact activity for LLM context
export interface CompactActivity {
  date: string;
  type: 'Run' | 'Ride' | 'WeightTraining' | 'Other';
  durationMin: number;
  distanceKm?: number;
  avgHr?: number;
  load?: number; // TSS
  feel?: number; // 1-5
  rpe?: number; // 1-10
  intervals?: string[]; // e.g. ['2x 14m 113bpm', '1x 7m16s 130bpm']
  notes?: string;
}

// Athlete profile
export interface AthleteProfile {
  age: number;
  maxHr: number;
  lthr: number;
  weight: number;
}

// Race goal
export interface RaceGoal {
  date: string;
  event: '5K' | '10K' | 'HalfMarathon' | 'Marathon';
  targetTime?: string;
}

// Weekly plan from Notion
export interface WeekPlan {
  id: string;
  planId: string;
  title: string;
  weekStart: string;
  status: 'Planned' | 'In Progress' | 'Done';
  goal: 'Build Fitness' | 'Increase Volume' | 'Recovery' | 'Race Week' | 'Maintenance';
  weekFocus?: string;
  plan: string;
  summary?: string;
  plannedLoad?: number;
  actualLoad?: number;
  generatedByAi: boolean;
  lastUpdated: string;
}

// Input for the coach agent
export interface CoachInput {
  athlete: AthleteProfile;
  wellness: Wellness;
  recentActivities: CompactActivity[];
  currentWeekPlan: WeekPlan | null;
  raceGoal: RaceGoal;
  weekNumber: number;
  totalWeeks: number;
  athleteState?: string;
  telegramContext?: string; // User's question from Telegram
}

// Config from environment
export interface Config {
  intervals: {
    athleteId: string;
    apiKey: string;
  };
  anthropic: {
    apiKey: string;
  };
  notion: {
    apiKey: string;
    plansDbId: string;
  };
}
