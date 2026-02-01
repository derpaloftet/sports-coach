import Anthropic from '@anthropic-ai/sdk';
import type { CoachInput, WeekPlan } from '../types/index.js';
import type { NotionClient } from '../integrations/notion.js';
import { coachTools, CreateWeekPlanInput, UpdateWeekPlanInput, FlagRiskInput, AddNoteInput } from './tools.js';
import { buildSystemPrompt, buildUserMessage } from './prompts.js';
import { today, getWeekStart, getWeekNumber, formatWeekRange } from '../utils/date.js';

export interface CoachResult {
  plan: WeekPlan | null;
  risks: Array<{ risk: string; message: string; severity: string }>;
  notes: string[];
  rawResponse: string;
}

export interface CoachConfig {
  apiKey: string;
  notion: NotionClient;
}

export class Coach {
  private readonly client: Anthropic;
  private readonly notion: NotionClient;

  constructor(config: CoachConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.notion = config.notion;
  }

  async run(input: CoachInput): Promise<CoachResult> {
    const systemPrompt = buildSystemPrompt(input);
    const userMessage = buildUserMessage(input);

    console.log('\n--- Calling Claude ---');

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      tools: coachTools,
      tool_choice: { type: 'any' },
      messages: [{ role: 'user', content: userMessage }],
    });

    const result: CoachResult = {
      plan: input.currentWeekPlan,
      risks: [],
      notes: [],
      rawResponse: '',
    };

    // Process response
    for (const block of response.content) {
      if (block.type === 'text') {
        result.rawResponse += block.text;
      } else if (block.type === 'tool_use') {
        console.log(`\nTool: ${block.name}`);
        console.log('Input:', JSON.stringify(block.input, null, 2));

        result.plan = await this.executeTool(block.name, block.input, input, result);
      }
    }

    return result;
  }

  private async executeTool(
    name: string,
    input: unknown,
    coachInput: CoachInput,
    result: CoachResult
  ): Promise<WeekPlan | null> {
    const weekStart = getWeekStart();
    const year = new Date(weekStart).getFullYear();
    const weekNum = getWeekNumber(weekStart);
    const planId = `plan-${year}-w${String(weekNum).padStart(2, '0')}`;
    const title = `Week ${weekNum}: ${formatWeekRange(weekStart)}`;

    switch (name) {
      case 'create_week_plan': {
        const toolInput = input as CreateWeekPlanInput;
        console.log('\n>>> Creating week plan...');

        const plan = await this.notion.createPlan({
          planId,
          title,
          weekStart,
          status: 'Planned',
          goal: toolInput.goal,
          plan: toolInput.plan,
          summary: toolInput.summary,
          plannedLoad: toolInput.plannedLoad,
          generatedByAi: true,
          lastUpdated: today(),
        });

        console.log(`Created plan: ${plan.planId}`);
        return plan;
      }

      case 'update_week_plan': {
        const toolInput = input as UpdateWeekPlanInput;
        if (!coachInput.currentWeekPlan) {
          console.log('>>> No existing plan to update');
          return null;
        }

        console.log('\n>>> Updating week plan...');

        const plan = await this.notion.updatePlan(coachInput.currentWeekPlan.id, {
          title,
          plan: toolInput.plan,
          summary: toolInput.summary,
          plannedLoad: toolInput.plannedLoad,
          lastUpdated: today(),
        });

        console.log(`Updated plan: ${plan.planId}`);
        return plan;
      }

      case 'flag_risk': {
        const toolInput = input as FlagRiskInput;
        console.log(`\n>>> RISK FLAGGED: [${toolInput.severity.toUpperCase()}] ${toolInput.risk}`);
        console.log(`    ${toolInput.message}`);
        result.risks.push(toolInput);
        return result.plan;
      }

      case 'add_note': {
        const toolInput = input as AddNoteInput;
        console.log(`\n>>> Note: ${toolInput.note}`);
        result.notes.push(toolInput.note);
        return result.plan;
      }

      default:
        console.log(`Unknown tool: ${name}`);
        return result.plan;
    }
  }
}
