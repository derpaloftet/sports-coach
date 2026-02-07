/**
 * Simple Telegram Bot API client for sending messages
 */

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export class TelegramClient {
  private readonly botToken: string;
  private readonly chatId: string;
  private readonly baseUrl: string;

  constructor(config: TelegramConfig) {
    this.botToken = config.botToken;
    this.chatId = config.chatId;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Send a text message to the configured chat
   */
  async sendMessage(text: string, options?: { parseMode?: 'Markdown' | 'HTML' }): Promise<void> {
    const url = `${this.baseUrl}/sendMessage`;

    const body = {
      chat_id: this.chatId,
      text,
      ...(options?.parseMode && { parse_mode: options.parseMode }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${response.status} ${error}`);
    }

    const result = await response.json() as { ok: boolean; description?: string };
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
    }
  }
}
