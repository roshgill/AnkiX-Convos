import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages, flashcardsList } = await req.json();

  if(!flashcardsList) {
    const result = streamText({
      model: openai('gpt-4o'),
      messages
    });
    return result.toDataStreamResponse();
  }
  else {

    // Build a prompt that includes the existing flashcards list.
    const prompt = `Analyze the conversation and the already created flashcards: ${JSON.stringify(
      flashcardsList
    )}. Return new flashcards that correspond to the current back and forth.`;

    // const prompt = 'Analyse the conversation and the already created flashcards. Return new flashcards that correspond to the current back and forth.';

    const result = await generateObject({
      model: openai('gpt-4o'),
      system: 'You generate three notifications for a messages app.',
      //messages: messages,
      prompt: prompt,
      schema: z.object({
        flashcards: z.array(
          z.object({
            front: z.string().describe('Front of the flashcard.'),
            back: z.string().describe('Back of the flashcard.'),
            reason: z.string().describe('Reason for creation of flashcard.')
          }),
        ),
      }),
    });
    return result.toJsonResponse();
  }

}