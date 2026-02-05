import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type { CoachInput, WeekPlan } from '../types/index.js';
import type { NotionClient } from '../integrations/notion.js';
import { coachTools, CreateWeekPlanInput, UpdateWeekPlanInput, FlagRiskInput, AddNoteInput } from './tools.js';
import { buildSystemPrompt, buildUserMessage } from './prompts.js';
import { nowISO, getWeekStart, getWeekNumber, formatWeekRange } from '../utils/date.js';

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

const MAX_TURNS = 4;

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
    const messages: MessageParam[] = [{ role: 'user', content: userMessage }];

    const result: CoachResult = {
      plan: input.currentWeekPlan,
      risks: [],
      notes: [],
      rawResponse: '',
    };

    const actions: string[] = [];
    let totalIn = 0;
    let totalOut = 0;

    for (let turn = 1; turn <= MAX_TURNS; turn++) {
      console.log(`\n--- Calling Claude (turn ${turn}) ---`);
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        tools: coachTools,
        tool_choice: { type: 'auto' },
        messages,
      });

      totalIn += response.usage.input_tokens;
      totalOut += response.usage.output_tokens;

      // Collect tool calls and results
      const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          result.rawResponse += block.text;
        } else if (block.type === 'tool_use') {
          actions.push(block.name);
          console.log(`\nTool: ${block.name}`);
          console.log('Input:', JSON.stringify(block.input, null, 2));

          const toolResultText = await this.executeTool(block.name, block.input, input, result);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: toolResultText,
          });
        }
      }

      // If no tool calls, we're done
      if (response.stop_reason !== 'tool_use' || toolResults.length === 0) {
        break;
      }

      // Feed tool results back for next turn
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    }

    console.log(`\nTokens total: ${totalIn} in, ${totalOut} out`);
    console.log(`Actions taken: ${actions.join(', ') || 'none'}`);
    return result;
  }

  private async executeTool(
    name: string,
    input: unknown,
    coachInput: CoachInput,
    result: CoachResult
  ): Promise<string> {
    const weekStart = getWeekStart();
    const year = new Date(weekStart).getFullYear();
    const weekNum = getWeekNumber(weekStart);
    const planId = `plan-${year}-w${String(weekNum).padStart(2, '0')}`;
    const title = `Week ${weekNum}: ${formatWeekRange(weekStart)}`;

    switch (name) {
      case 'create_week_plan': {
        const toolInput = input as CreateWeekPlanInput;
        console.log('\n>>> Creating week plan...');
        if (toolInput.weekFocus) {
          console.log(`Focus: ${toolInput.weekFocus}`);
        }

        const plan = await this.notion.createPlan(
          {
            planId,
            title,
            weekStart,
            status: 'Planned',
            goal: toolInput.goal,
            weekFocus: toolInput.weekFocus,
            plan: toolInput.plan,
            summary: toolInput.summary,
            plannedLoad: toolInput.plannedLoad,
            generatedByAi: true,
            lastUpdated: nowISO(),
          },
          toolInput.dailyNote,
        );

        console.log(`Created plan: ${plan.planId}`);
        result.plan = plan;
        return `Plan created: ${plan.planId}`;
      }

      case 'update_week_plan': {
        const toolInput = input as UpdateWeekPlanInput;
        if (!coachInput.currentWeekPlan) {
          console.log('>>> No existing plan to update');
          return 'Error: no existing plan to update';
        }

        console.log('\n>>> Updating week plan...');
        if (toolInput.weekFocus) {
          console.log(`Focus: ${toolInput.weekFocus}`);
        }

        const plan = await this.notion.updatePlan(
          coachInput.currentWeekPlan.id,
          {
            title,
            weekFocus: toolInput.weekFocus,
            plan: toolInput.plan,
            summary: toolInput.summary,
            plannedLoad: toolInput.plannedLoad,
            lastUpdated: nowISO(),
          },
          toolInput.dailyNote,
        );

        console.log(`Updated plan: ${plan.planId}`);
        result.plan = plan;
        return `Plan updated: ${plan.planId}`;
      }

      case 'flag_risk': {
        const toolInput = input as FlagRiskInput;
        console.log(`\n>>> RISK FLAGGED: [${toolInput.severity.toUpperCase()}] ${toolInput.risk}`);
        console.log(`    ${toolInput.message}`);
        result.risks.push(toolInput);
        return `Risk flagged: ${toolInput.risk} (${toolInput.severity})`;
      }

      case 'add_note': {
        const toolInput = input as AddNoteInput;
        console.log(`\n>>> Note: ${toolInput.note}`);
        result.notes.push(toolInput.note);
        return `Note recorded`;
      }

      default:
        console.log(`Unknown tool: ${name}`);
        return `Unknown tool: ${name}`;
    }
  }
}
