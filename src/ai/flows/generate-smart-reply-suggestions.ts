'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating smart reply suggestions.
 *
 * - generateSmartReplySuggestions - A function that provides intelligent, context-aware quick reply suggestions.
 * - GenerateSmartReplySuggestionsInput - The input type for the generateSmartReplySuggestions function.
 * - GenerateSmartReplySuggestionsOutput - The return type for the generateSmartReplySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageSchema = z.object({
  sender: z.string().describe('The name of the sender of the message.'),
  text: z.string().describe('The content of the message.'),
});

const GenerateSmartReplySuggestionsInputSchema = z.object({
  conversationHistory: z
    .array(MessageSchema)
    .describe('The history of the ongoing conversation.'),
});
export type GenerateSmartReplySuggestionsInput = z.infer<
  typeof GenerateSmartReplySuggestionsInputSchema
>;

const GenerateSmartReplySuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of context-aware quick reply suggestions.'),
});
export type GenerateSmartReplySuggestionsOutput = z.infer<
  typeof GenerateSmartReplySuggestionsOutputSchema
>;

export async function generateSmartReplySuggestions(
  input: GenerateSmartReplySuggestionsInput
): Promise<GenerateSmartReplySuggestionsOutput> {
  return generateSmartReplySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartReplySuggestionsPrompt',
  input: {schema: GenerateSmartReplySuggestionsInputSchema},
  output: {schema: GenerateSmartReplySuggestionsOutputSchema},
  prompt: `You are an AI assistant that provides smart reply suggestions for an ongoing chat conversation.
Based on the following conversation history, generate 3-5 short, context-aware, and polite reply suggestions that a user could send next.
The suggestions should be brief and relevant to the last message and overall conversation context.

Conversation History:
{{#each conversationHistory}}
  {{sender}}: {{{text}}}
{{/each}}

Suggestions:`,
});

const generateSmartReplySuggestionsFlow = ai.defineFlow(
  {
    name: 'generateSmartReplySuggestionsFlow',
    inputSchema: GenerateSmartReplySuggestionsInputSchema,
    outputSchema: GenerateSmartReplySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
