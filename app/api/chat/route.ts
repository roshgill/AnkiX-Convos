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
    const prompt = `Current Conversation: ${JSON.stringify(messages)} | Currently created flashcards: ${JSON.stringify(
      flashcardsList
    )}`;

    // const prompt = 'Analyse the conversation and the already created flashcards. Return new flashcards that correspond to the current back and forth.';

    const result = await generateObject({
      model: openai('gpt-4o'),
      system: `You are an assistant that generates flashcards based on the conversation and the already created flashcards. Use the conversation to identify fresh topics and insights that have not been covered in the existing flashcards, and avoid creating duplicate content. A good flashcard is one that is very concise and focused—it asks a clear, specific question testing a single fact or concept, and a direct answer.`,
      prompt: prompt,
      schema: z.object({
        flashcards: z.array(
          z.object({
            front: z.string().describe('Front of the flashcard.'),
            back: z.string().describe('Back of the flashcard.'),
            reason: z.string().describe('Reason for creation of flashcard. This could be the context or the conversation that led to the creation of the flashcard. Keep it brief.'),
          }),
        ),
      }),
    });
    return result.toJsonResponse();
  }

}