'use server';
/**
 * @fileOverview An AI assistant flow that suggests a breakdown of common tasks for a new project based on its description.
 *
 * - suggestProjectTasks - A function that handles the task suggestion process.
 * - SuggestProjectTasksInput - The input type for the suggestProjectTasks function.
 * - SuggestProjectTasksOutput - The return type for the suggestProjectTasks function.
 */

import {ai, z} from '@/ai/genkit';

const SuggestProjectTasksInputSchema = z.object({
  projectDescription: z
    .string()
    .describe("A detailed description of the project for which tasks need to be suggested."),
});
export type SuggestProjectTasksInput = z.infer<typeof SuggestProjectTasksInputSchema>;

const SuggestProjectTasksOutputSchema = z.object({
  tasks: z.array(
    z.object({
      name: z.string().describe('The name of the suggested task.'),
      description: z.string().describe('A brief description of the suggested task.'),
    })
  ),
});
export type SuggestProjectTasksOutput = z.infer<typeof SuggestProjectTasksOutputSchema>;

export async function suggestProjectTasks(
  input: SuggestProjectTasksInput
): Promise<SuggestProjectTasksOutput> {
  try {
    return await suggestProjectTasksFlow(input);
  } catch (error: any) {
    console.error("Genkit Flow Error:", error);
    throw new Error(error.message || "Failed to generate tasks");
  }
}

const prompt = ai.definePrompt({
  name: 'suggestProjectTasksPrompt',
  input: {schema: SuggestProjectTasksInputSchema},
  output: {schema: SuggestProjectTasksOutputSchema},
  prompt: `You are an expert project manager AI. Based on the following project description, suggest a breakdown of common tasks that would typically be involved in such a project.

Provide at least 5-10 common tasks, each with a concise name and a brief description.

Project Description: {{{projectDescription}}}`,
});

const suggestProjectTasksFlow = ai.defineFlow(
  {
    name: 'suggestProjectTasksFlow',
    inputSchema: SuggestProjectTasksInputSchema,
    outputSchema: SuggestProjectTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI returned no suggestions. Please try a more detailed description.");
    }
    return output;
  }
);
