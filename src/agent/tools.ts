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
            'CRITICAL: Two sections required - Reality first, then Plan.\n\n## Reality (what actually happened)\nLook for the "### This Week" section in Training History. Extract activities from that section ONLY.\nFor each day Monday-Sunday:\n1. Find activities with matching ISO date (e.g., 2024-02-05 is Wednesday if the week starts 2024-02-03)\n2. Convert to format "Day DD.MM: [workout description]" (e.g., "Wed 05.01: Easy run 33min Zone 2")\n3. If no activity for a day, write "Day DD.MM: Rest"\n\nExample extraction:\nTraining History shows:\n  ### This Week (03.01 - 09.01)\n  2024-02-05 | Run | 33min | 5.2km | ...\n  2024-02-04 | Weight training | 33min\n\nYou write:\n  ## Reality\n  Mon 03.01: Rest\n  Tue 04.01: Weight training 23min\n  Wed 05.01: Easy run 33min Zone 2 (5.2km)\n  Thu 06.01: Rest\n  Fri 07.01: Rest\n  Sat 08.01: Rest\n  Sun 09.01: Rest\n\n## Plan (the full week plan)\nALWAYS show the full week plan (Monday-Sunday) with all 7 days. This is the stable weekly plan.\nList planned workouts for ALL days Monday through Sunday:\n- Mon DD.MM: [planned workout or Rest]\n- Tue DD.MM: [planned workout or Rest]\n- ...\n- Sun DD.MM: [planned workout or Rest]\n\nThe plan should be stable for the whole week. Don\'t exclude past days - show the full 7-day plan.\n\nComplete example (if today is Saturday):\n## Reality\nMon 03.01: Rest\nTue 04.01: Weight training 33min\nWed 05.01: Easy run 33min Zone 2 (5.2km)\nThu 06.01: Rest\nFri 07.01: Weight training 30min\nSat 08.01: Rest\nSun 09.01: Rest\n\n## Plan\nMon 03.01: Rest\nTue 04.01: Weight training 30min\nWed 05.01: Easy run 35min Zone 2\nThu 06.01: 6x2min Zone 4 intervals\nFri 07.01: Weight training 30min\nSat 08.01: Long run 60min Zone 2\nSun 09.01: Rest',
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
          description: 'Updated plan using two-section format:\n## Reality (extract from "### This Week" section in Training History)\n## Plan (full week plan, Monday-Sunday, all 7 days)\n\nMUST include Reality section with actual workouts from this week. Extract from "### This Week" section only, convert ISO dates (2024-02-05) to day format (Wed 05.01).\n\nMUST include full Plan section with all 7 days (Mon-Sun) showing the complete weekly plan.\n\nSee create_week_plan tool description for detailed format and examples.',
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
