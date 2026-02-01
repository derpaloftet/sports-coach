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
        plan: {
          type: 'string',
          description:
            'Daily workout plan, one line per day in format "Mon: description". Include all 7 days.',
        },
        summary: {
          type: 'string',
          description: 'Brief explanation of the plan rationale (1-2 sentences)',
        },
        plannedLoad: {
          type: 'number',
          description: 'Expected weekly training load (TSS)',
        },
      },
      required: ['goal', 'plan', 'summary', 'plannedLoad'],
    },
  },
  {
    name: 'update_week_plan',
    description:
      'Update the current week plan. Use to adjust workouts based on how the week is going.',
    input_schema: {
      type: 'object' as const,
      properties: {
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
      },
      required: ['plan', 'summary'],
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
  plan: string;
  summary: string;
  plannedLoad: number;
}

export interface UpdateWeekPlanInput {
  plan: string;
  summary: string;
  plannedLoad?: number;
}

export interface FlagRiskInput {
  risk: 'volume_spike' | 'high_fatigue' | 'inadequate_recovery' | 'overreaching';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AddNoteInput {
  note: string;
}
