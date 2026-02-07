/**
 * Entry point for running the bot locally in long polling mode
 * Usage: npm run bot:local
 */

import 'dotenv/config';
import { startBot } from './bot.js';

// Start the bot
startBot().catch(console.error);
