import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import { ParsedIntent, ParsedIntentSchema } from '../types/intent.js';
import { INTENT_PARSER_SYSTEM_PROMPT } from '../prompts/intent-parser.prompt.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/error-handler.js';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

interface ParseResult {
  intent: ParsedIntent | null;
  clarification: string | null;
}

export async function parseUserIntent(message: string): Promise<ParseResult> {
  try {
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: INTENT_PARSER_SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      temperature: 0,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new AppError(502, 'AI_EMPTY_RESPONSE', 'AI returned an empty response');
    }

    logger.debug({ rawAiResponse: content }, 'Groq response');

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new AppError(502, 'AI_INVALID_JSON', 'AI returned invalid JSON');
    }

    // Check if it's a clarification response
    if (parsed.type === null || parsed.type === undefined) {
      return {
        intent: null,
        clarification: (parsed.clarification as string) || 'Could you please clarify what transaction you\'d like to perform? I can help with sending SOL, swapping tokens, or bank payouts.',
      };
    }

    // Validate the intent against our schema
    const intentResult = ParsedIntentSchema.safeParse(parsed);
    if (!intentResult.success) {
      logger.warn({ errors: intentResult.error.flatten(), raw: parsed }, 'AI response failed schema validation');
      return {
        intent: null,
        clarification: 'I had trouble understanding that. Could you rephrase? For example: "send 1 SOL to [address]" or "swap 2 SOL for USDC".',
      };
    }

    return { intent: intentResult.data, clarification: null };
  } catch (error) {
    if (error instanceof AppError) throw error;

    logger.error({ error }, 'Groq API call failed');
    throw new AppError(502, 'AI_SERVICE_ERROR', 'AI service is temporarily unavailable. Please try again.');
  }
}
