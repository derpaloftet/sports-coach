import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export const coachTools: Tool[] = [
  {
    name: 'create_week_plan',
    description:
      'Create a new training week plan. Use when no plan exists for the current week.',
    input_schema: {
      type: 'object' as const,
      properties: {
        goal: {
          type: 'string',
          enum: ['Build Fitness', 'Increase Volume', 'Recovery', 'Race Week', 'Maintenance'],
          description: 'The training goal for this week',
        },
        weekFocus: {
          type: 'string',
          description:
            'Short informal coach note shown on the plan page. Keep it casual and direct — like a mate who coaches you. Structure: (1) Quick take on last week (1-2 sentences). (2) What matters this week (1 sentence). (3) Technique cue (1 line, e.g. "Technique: cadence — short quick steps, 170-180 spm").',
        },
        plan: {
          type: 'string',
          description:
            'Daily workout plan, one line per day in format "Mon DD.MM: description" (e.g. "Thu 05.02: 6x2min Zone 4, 2min jog recovery"). Include all 7 days.',
        },
        summary: {
          type: 'string',
          description: 'Brief explanation of the plan rationale (1-2 sentences)',
        },
        plannedLoad: {
          type: 'number',
          description: 'Expected weekly training load (TSS)',
        },
        dailyNote: {
          type: 'string',
          description:
            'Optional short note about today/tomorrow — what to focus on right now. Shown at the top of the plan page, not stored in DB.',
        },
      },
      required: ['goal', 'weekFocus', 'plan', 'summary', 'plannedLoad'],
    },
  },
  {
    name: 'update_week_plan',
    description:
      'Update the current week plan. Use to adjust workouts based on how the week is going.',
    input_schema: {
      type: 'object' as const,
      properties: {
        weekFocus: {
          type: 'string',
          description:
            'Updated coach note. Keep it short and informal. (1) Quick review so far. (2) What to adjust. (3) Technique cue.',
        },
        plan: {
          type: 'string',
          description: 'Updated daily workout plan',
        },
        summary: {
          type: 'string',
          description: 'Explanation of what changed and why',
        },
        plannedLoad: {
          type: 'number',
          description: 'Updated expected weekly training load',
        },
        dailyNote: {
          type: 'string',
          description:
            'Optional short note about today/tomorrow — what to focus on right now.',
        },
      },
      required: ['weekFocus', 'plan', 'summary'],
    },
  },
  {
    name: 'flag_risk',
    description:
      'Flag a potential injury or overtraining risk. Use when metrics indicate concern.',
    input_schema: {
      type: 'object' as const,
      properties: {
        risk: {
          type: 'string',
          enum: ['volume_spike', 'high_fatigue', 'inadequate_recovery', 'overreaching'],
          description: 'Type of risk detected',
        },
        message: {
          type: 'string',
          description: 'Explanation of the risk and recommended action',
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'How serious is the risk',
        },
      },
      required: ['risk', 'message', 'severity'],
    },
  },
  {
    name: 'add_note',
    description: 'Add a coaching observation or note. Use for insights that should be recorded.',
    input_schema: {
      type: 'object' as const,
      properties: {
        note: {
          type: 'string',
          description: 'The observation or note to record',
        },
      },
      required: ['note'],
    },
  },
];

// Tool input types for type safety
export interface CreateWeekPlanInput {
  goal: 'Build Fitness' | 'Increase Volume' | 'Recovery' | 'Race Week' | 'Maintenance';
  weekFocus: string;
  plan: string;
  summary: string;
  plannedLoad: number;
  dailyNote?: string;
}

export interface UpdateWeekPlanInput {
  weekFocus: string;
  plan: string;
  summary: string;
  plannedLoad?: number;
  dailyNote?: string;
}

export interface FlagRiskInput {
  risk: 'volume_spike' | 'high_fatigue' | 'inadequate_recovery' | 'overreaching';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AddNoteInput {
  note: string;
}
