import type { Activity, AthleteProfile, CompactActivity, Wellness } from '../types/index.js';

export interface IntervalsConfig {
  athleteId: string;
  apiKey: string;
}

export class IntervalsClient {
  private readonly baseUrl = 'https://intervals.icu/api/v1';
  private readonly headers: Record<string, string>;
  private readonly athleteId: string;

  constructor(config: IntervalsConfig) {
    this.athleteId = config.athleteId;
    // Intervals.icu uses Basic auth with API_KEY as username
    const authToken = Buffer.from(`API_KEY:${config.apiKey}`).toString('base64');
    this.headers = {
      Authorization: `Basic ${authToken}`,
      'Content-Type': 'application/json',
    };
  }

  async getAthlete(): Promise<AthleteProfile> {
    const url = `${this.baseUrl}/athlete/${this.athleteId}`;
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`Intervals.icu API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      icu_date_of_birth?: string;
      icu_weight?: number;
      sportSettings?: Array<{
        types: string[];
        max_hr?: number;
        lthr?: number;
      }>;
    };

    // Calculate age from date of birth
    const dob = data.icu_date_of_birth;
    const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

    // Get HR settings from Run sport settings
    const runSettings = data.sportSettings?.find((s) => s.types.includes('Run'));

    return {
      age,
      maxHr: runSettings?.max_hr ?? 0,
      lthr: 153, //runSettings?.lthr ?? 0,
      weight: data.icu_weight ?? 0,
    };
  }

  async getActivities(oldestDate: string): Promise<Activity[]> {
    const url = `${this.baseUrl}/athlete/${this.athleteId}/activities?oldest=${oldestDate}`;
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`Intervals.icu API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<Activity[]>;
  }

  async getWellness(date: string): Promise<Wellness | null> {
    const url = `${this.baseUrl}/athlete/${this.athleteId}/wellness/${date}`;
    const response = await fetch(url, { headers: this.headers });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Intervals.icu API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      ctl?: number;
      atl?: number;
      restingHR?: number;
      weight?: number;
    };
    const ctl = data.ctl ?? 0;
    const atl = data.atl ?? 0;
    return {
      ctl,
      atl,
      tsb: ctl - atl, // TSB = CTL - ATL
      restingHR: data.restingHR,
      weight: data.weight,
    };
  }

  /**
   * Fetch activities and return them in compact format for LLM context.
   * Filters to runs, rides, and weight training by default.
   */
  async getCompactActivities(
    oldestDate: string,
    types: string[] = ['run', 'ride', 'weight']
  ): Promise<CompactActivity[]> {
    const activities = await this.getActivities(oldestDate);
    const filtered = activities.filter((activity) =>
      types.some((type) => activity.type.toLowerCase().includes(type))
    );
    return this.toCompact(filtered);
  }

  private toCompact(activities: Activity[]): CompactActivity[] {
    return activities.map((a) => {
      let type: CompactActivity['type'] = 'Other';
      const lowerType = a.type.toLowerCase();
      if (lowerType.includes('run')) type = 'Run';
      else if (lowerType.includes('ride') || lowerType.includes('cycling')) type = 'Ride';
      else if (lowerType.includes('weight')) type = 'WeightTraining';

      return {
        date: a.start_date_local.split('T')[0],
        type,
        durationMin: Math.round((a.moving_time ?? a.elapsed_time ?? 0) / 60),
        distanceKm: a.distance ? Math.round((a.distance / 1000) * 100) / 100 : undefined,
        avgHr: a.average_heartrate,
        load: a.icu_training_load,
        feel: a.feel,
        rpe: a.icu_rpe,
        intervals: a.interval_summary,
        notes: a.description,
      };
    });
  }
}
