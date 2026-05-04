'use server';
/**
 * @fileOverview An AI assistant that can answer questions about past conversations and retrieve specific information.
 *
 * - aiSearchAndInformationRetrieval - A function that handles the AI search and information retrieval process.
 * - AiSearchAndInformationRetrievalInput - The input type for the aiSearchAndInformationRetrieval function.
 * - AiSearchAndInformationRetrievalOutput - The return type for the aiSearchAndInformationRetrieval function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSearchAndInformationRetrievalInputSchema = z.object({
  query: z.string().describe('The user\u0027s question about the conversation history.'),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'model']).describe('The role of the speaker (user or model).'),
      content: z.string().describe('The content of the message.'),
    })
  ).describe('A list of past messages in the conversation.'),
});
export type AiSearchAndInformationRetrievalInput = z.infer<typeof AiSearchAndInformationRetrievalInputSchema>;

const AiSearchAndInformationRetrievalOutputSchema = z.string().describe('A concise answer or retrieved information based on the query and conversation history.');
export type AiSearchAndInformationRetrievalOutput = z.infer<typeof AiSearchAndInformationRetrievalOutputSchema>;

export async function aiSearchAndInformationRetrieval(input: AiSearchAndInformationRetrievalInput): Promise<AiSearchAndInformationRetrievalOutput> {
  return aiSearchAndInformationRetrievalFlow(input);
}

const aiSearchAndInformationRetrievalPrompt = ai.definePrompt({
  name: 'aiSearchAndInformationRetrievalPrompt',
  input: {schema: AiSearchAndInformationRetrievalInputSchema},
  output: {schema: AiSearchAndInformationRetrievalOutputSchema},
  prompt: `You are an AI assistant designed to help users quickly find information from their past conversations.

Your task is to answer the user's query by referring only to the provided conversation history. If the information is not available in the conversation history, state that you cannot find the information.

Conversation History:
{{#each conversationHistory}}
  {{this.role}}: {{{this.content}}}
{{/each}}

User Query: {{{query}}}

Based on the conversation history, provide a concise answer to the user's query or retrieve the specific information requested.`,
});

const aiSearchAndInformationRetrievalFlow = ai.defineFlow(
  {
    name: 'aiSearchAndInformationRetrievalFlow',
    inputSchema: AiSearchAndInformationRetrievalInputSchema,
    outputSchema: AiSearchAndInformationRetrievalOutputSchema,
  },
  async (input) => {
    const {output} = await aiSearchAndInformationRetrievalPrompt(input);
    return output!;
  }
);
