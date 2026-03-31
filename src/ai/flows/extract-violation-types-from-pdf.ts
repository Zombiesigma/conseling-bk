
'use server';
/**
 * @fileOverview An AI agent that extracts a list of violation types and points from a PDF.
 *
 * - extractViolationTypesFromPdf - A function that handles the extraction process.
 * - ExtractViolationTypesInput - The input type.
 * - ExtractViolationTypesOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ViolationTypeSchema = z.object({
  name: z.string().describe('The name of the violation.'),
  points: z.number().describe('The points or penalty associated with it.'),
});

const ExtractViolationTypesInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,...'"
    ),
});
export type ExtractViolationTypesInput = z.infer<typeof ExtractViolationTypesInputSchema>;

const ExtractViolationTypesOutputSchema = z.object({
  violationTypes: z.array(ViolationTypeSchema).describe('A list of violation types and their points extracted from the document.'),
});
export type ExtractViolationTypesOutput = z.infer<typeof ExtractViolationTypesOutputSchema>;

export async function extractViolationTypesFromPdf(input: ExtractViolationTypesInput): Promise<ExtractViolationTypesOutput> {
  return extractViolationTypesFromPdfFlow(input);
}

const extractViolationTypesPrompt = ai.definePrompt({
  name: 'extractViolationTypesPrompt',
  input: { schema: ExtractViolationTypesInputSchema },
  output: { schema: ExtractViolationTypesOutputSchema },
  prompt: `You are an expert at analyzing school disciplinary regulations. 
Examine the provided PDF document and extract a comprehensive list of all student violations mentioned, along with their associated penalty points or weights.

Common violations include things like tardiness, uniform issues, smoking, etc.

Document: {{media url=pdfDataUri}}`,
});

const extractViolationTypesFromPdfFlow = ai.defineFlow(
  {
    name: 'extractViolationTypesFromPdfFlow',
    inputSchema: ExtractViolationTypesInputSchema,
    outputSchema: ExtractViolationTypesOutputSchema,
  },
  async (input) => {
    const { output } = await extractViolationTypesPrompt(input);
    return output!;
  }
);
