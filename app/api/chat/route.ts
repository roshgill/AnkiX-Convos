import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages, isQuickDefinition } = await req.json();

  if(!isQuickDefinition) {
    const result = streamText({
      model: openai('gpt-4o'),
      messages
    });
    return result.toDataStreamResponse();
  }
  else {
    // Build a prompt that includes the existing flashcards list.
    const prompt = "Define";

    // const prompt = 'Analyse the conversation and the already created flashcards. Return new flashcards that correspond to the current back and forth.';

    const result = await generateObject({
      model: openai('gpt-4o'),
      system: `You generate definitions from selected text.`,
      prompt: prompt,
      schema: z.object({
        Definition: z.array(
          z.object({
            definition: z.string().describe('Define item')
          }),
        ),
      }),
    });
    return result.toJsonResponse();
  }

}