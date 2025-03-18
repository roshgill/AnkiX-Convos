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
      system: `You generate concise cloze flashcards based on the conversation and existing flashcards to ensure coverage of new topics and insights without duplication. Each flashcard should hide exactly one important term or short phrase using {{c1::...}}. Focus specifically on unique, relevant points from the current conversation that have not already been addressed, avoiding trivial words (e.g., "the," "and") or single letters. The goal is to produce clear, focused flashcards that each test understanding of a distinct fact or concept.`,
      prompt: prompt,
      schema: z.object({
        flashcards: z.array(
          z.object({
            front: z.string().describe('Cloze flashcard front. Use {{c1::...}} to hide the term or phrase.'),
            //back: z.string().describe('Back of the flashcard.'),
            reason: z.string().describe('Reason for creation of flashcard. This could be the context or the conversation that led to the creation of the flashcard. Keep it very brief.'),
          }),
        ),
      }),
    });
    return result.toJsonResponse();
  }

}