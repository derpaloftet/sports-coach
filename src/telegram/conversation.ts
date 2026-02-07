/**
 * Conversational message handler
 * Routes messages to the Coach and formats responses
 */

import type { Context } from 'grammy';
import { main } from '../index.js';

/**
 * Handle conversational messages from Telegram
 * Calls the main coach function with the user's message
 */
export async function handleConversation(ctx: Context) {
  const userMessage = ctx.message?.text;

  if (!userMessage) {
    await ctx.reply('Sorry, I can only process text messages.');
    return;
  }

  console.log(`\n[Telegram] ========================================`);
  console.log(`[Telegram] Received message: "${userMessage}"`);
  console.log(`[Telegram] From chat ID: ${ctx.chat?.id}`);
  console.log(`[Telegram] ========================================\n`);

  // Show typing indicator
  await ctx.replyWithChatAction('typing');

  try {
    console.log(`[Telegram] Calling main() with telegram context...`);
    const startTime = Date.now();

    // Call main() with telegram context
    const result = await main(userMessage);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Telegram] main() completed in ${elapsed}s`);

    if (!result) {
      console.log(`[Telegram] No result returned, sending default message`);
      await ctx.reply('Plan check completed. No changes needed.');
      return;
    }

    console.log(`[Telegram] Formatting response...`);
    console.log(`[Telegram] Result:`, JSON.stringify({
      plan: result.plan?.title,
      risksCount: result.risks?.length || 0,
      notesCount: result.notes?.length || 0,
      rawResponseLength: result.rawResponse?.length || 0,
    }));

    // Format and send response
    const response = formatCoachResponse(result);
    console.log(`[Telegram] Sending response (${response.length} chars)...`);
    await ctx.reply(response);

    console.log(`[Telegram] ✓ Response sent successfully\n`);
  } catch (error) {
    console.error('[Telegram] ❌ Error handling message:', error);
    console.error('[Telegram] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    await ctx.reply(
      '❌ Sorry, something went wrong. Please try again.\n\n' +
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Format coach result for Telegram display
 */
function formatCoachResponse(result: any): string {
  let response = '';

  // If there's raw text response, include it
  if (result.rawResponse) {
    response += result.rawResponse.trim() + '\n\n';
  }

  // If a plan was created/updated
  if (result.plan) {
    response += `📋 *${result.plan.title}*\n`;
    response += `Goal: ${result.plan.goal}\n`;
    if (result.plan.plannedLoad) {
      response += `Load: ${result.plan.plannedLoad} TSS\n`;
    }
    response += '\n';

    if (result.plan.weekFocus) {
      response += `${result.plan.weekFocus}\n\n`;
    }
  }

  // If risks were flagged
  if (result.risks && result.risks.length > 0) {
    response += '⚠️ *Risks Flagged*\n';
    for (const risk of result.risks) {
      response += `• [${risk.severity}] ${risk.message}\n`;
    }
    response += '\n';
  }

  // If notes were added
  if (result.notes && result.notes.length > 0) {
    response += '📝 *Notes*\n';
    for (const note of result.notes) {
      response += `• ${note}\n`;
    }
  }

  // If no content, provide a default message
  if (!response.trim()) {
    response = 'All good! Let me know if you have any other questions.';
  }

  return response.trim();
}
