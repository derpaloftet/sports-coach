/**
 * Telegram bot handler using Grammy
 * This file sets up the bot in long polling mode for local development
 */

import { Bot } from 'grammy';
import { handleConversation } from './conversation.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
}

if (!TELEGRAM_CHAT_ID) {
  console.warn('WARNING: TELEGRAM_CHAT_ID not set. Bot will respond to all messages (use for getting chat ID)');
}

export const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Authentication middleware - only respond to configured chat ID
bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id.toString();

  if (!TELEGRAM_CHAT_ID) {
    // If chat ID not configured, allow all (for initial setup)
    return next();
  }

  if (chatId !== TELEGRAM_CHAT_ID) {
    console.log(`Unauthorized access attempt from chat ID: ${chatId}`);
    await ctx.reply('Sorry, this bot is private.');
    return;
  }

  return next();
});

// /start command - onboarding
bot.command('start', async (ctx) => {
  const chatId = ctx.chat.id;

  await ctx.reply(
    `👋 Welcome to Sport Coach!\n\n` +
    `I'm your AI running coach powered by Claude. Ask me anything about your training!\n\n` +
    `**Your Chat ID**: ${chatId}\n` +
    `Add this to your .env file as TELEGRAM_CHAT_ID\n\n` +
    `**Examples**:\n` +
    `- "What's today's workout?"\n` +
    `- "How's my fitness looking?"\n` +
    `- "Should I run today? I'm feeling tired"\n` +
    `- "Can you create this week's plan?"\n\n` +
    `Just ask naturally - no commands needed!`
  );
});

// Handle all text messages (conversational)
bot.on('message:text', async (ctx) => {
  // Skip if it's a command (handled above)
  if (ctx.message.text.startsWith('/')) {
    return;
  }

  await handleConversation(ctx);
});

// Error handling
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Start bot in long polling mode (for local development)
export async function startBot() {
  console.log('Starting Telegram bot in long polling mode...');

  try {
    await bot.start({
      onStart: (botInfo) => {
        console.log(`✓ Bot @${botInfo.username} is running`);
        console.log(`✓ Ready to receive messages`);
        console.log(`\nSend a message to your bot to test it!`);
      },
    });
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\nShutting down bot...');
  bot.stop();
});

process.once('SIGTERM', () => {
  console.log('\nShutting down bot...');
  bot.stop();
});
