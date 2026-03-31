'use server';
/**
 * @fileOverview An AI agent that extracts student violation details from a PDF document.
 *
 * - extractViolationFromPdf - A function that handles the extraction process.
 * - ExtractViolationInput - The input type for the function.
 * - ExtractViolationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractViolationInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,...'"
    ),
});
export type ExtractViolationInput = z.infer<typeof ExtractViolationInputSchema>;

const ExtractViolationOutputSchema = z.object({
  studentName: z.string().optional().describe('The name of the student mentioned in the report.'),
  date: z.string().optional().describe('The date of the incident in YYYY-MM-DD format.'),
  type: z.string().optional().describe('The concise type or category of the violation.'),
  description: z.string().optional().describe('A detailed summary of the incident extracted from the document.'),
});
export type ExtractViolationOutput = z.infer<typeof ExtractViolationOutputSchema>;

export async function extractViolationFromPdf(input: ExtractViolationInput): Promise<ExtractViolationOutput> {
  return extractViolationFromPdfFlow(input);
}

const extractViolationPrompt = ai.definePrompt({
  name: 'extractViolationPrompt',
  input: { schema: ExtractViolationInputSchema },
  output: { schema: ExtractViolationOutputSchema },
  prompt: `You are an expert administrative assistant for a school guidance office. 
Your task is to analyze the provided PDF document, which is a report of a student's disciplinary violation.

Extract the following information accurately:
1. Student Name: Full name of the student involved.
2. Date: The date the incident occurred (format as YYYY-MM-DD).
3. Type: A short, 1-3 word classification of the violation (e.g., Bullying, Late, Uniform).
4. Description: A clear and comprehensive summary of the event.

If you cannot find a specific piece of information, leave that field empty.

Document: {{media url=pdfDataUri}}`,
});

const extractViolationFromPdfFlow = ai.defineFlow(
  {
    name: 'extractViolationFromPdfFlow',
    inputSchema: ExtractViolationInputSchema,
    outputSchema: ExtractViolationOutputSchema,
  },
  async (input) => {
    const { output } = await extractViolationPrompt(input);
    return output!;
  }
);
