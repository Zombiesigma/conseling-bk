'use server';
/**
 * @fileOverview An AI agent that suggests violation categories based on a description.
 *
 * - suggestViolationCategories - A function that handles the suggestion of violation categories.
 * - SuggestViolationCategoriesInput - The input type for the suggestViolationCategories function.
 * - SuggestViolationCategoriesOutput - The return type for the suggestViolationCategories function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestViolationCategoriesInputSchema = z.object({
  violationDescription: z.string().describe('The detailed description of the student violation.'),
});
export type SuggestViolationCategoriesInput = z.infer<typeof SuggestViolationCategoriesInputSchema>;

const SuggestViolationCategoriesOutputSchema = z.object({
  suggestedCategories: z.array(z.string()).describe('An array of suggested violation categories.'),
  primaryCategory: z.string().describe('The most relevant single category from the standard list.'),
});
export type SuggestViolationCategoriesOutput = z.infer<typeof SuggestViolationCategoriesOutputSchema>;

export async function suggestViolationCategories(input: SuggestViolationCategoriesInput): Promise<SuggestViolationCategoriesOutput> {
  return suggestViolationCategoriesFlow(input);
}

const suggestViolationCategoriesPrompt = ai.definePrompt({
  name: 'suggestViolationCategoriesPrompt',
  input: { schema: SuggestViolationCategoriesInputSchema },
  output: { schema: SuggestViolationCategoriesOutputSchema },
  prompt: `You are an AI assistant for a school guidance counselor system in Indonesia. 
Your task is to analyze a student's violation description and map it to the most appropriate standard categories.

STANDARD CATEGORIES:
- Keterlambatan (Tardiness)
- Atribut & Seragam (Uniform/Grooming)
- Ketidakhadiran Tanpa Izin (Unauthorized Absence/Alpha)
- Perkelahian (Fighting)
- Perundungan/Bullying (Bullying)
- Merokok/Vaping (Smoking/Vaping)
- Perjudian (Gambling)
- Miras/Narkoba (Alcohol/Drugs)
- Vandalisme (Vandalism)
- Penggunaan Gadget (Misuse of Electronics)
- Plagiarisme/Mencontek (Academic Dishonesty)
- Pelanggaran Tata Tertib Umum (General Discipline Infraction)

Pick the one 'primaryCategory' that is the most accurate match from the list above.

Violation Description: {{{violationDescription}}}`,
});

const suggestViolationCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestViolationCategoriesFlow',
    inputSchema: SuggestViolationCategoriesInputSchema,
    outputSchema: SuggestViolationCategoriesOutputSchema,
  },
  async (input) => {
    const { output } = await suggestViolationCategoriesPrompt(input);
    return output!;
  }
);
