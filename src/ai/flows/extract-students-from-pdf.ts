'use server';
/**
 * @fileOverview An AI agent that extracts a list of students (name and NISN) from a PDF.
 *
 * - extractStudentsFromPdf - A function that handles the extraction process.
 * - ExtractStudentsInput - The input type.
 * - ExtractStudentsOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractedStudentSchema = z.object({
  name: z.string().describe('Full name of the student.'),
  studentIdNumber: z.string().describe('NISN or student identification number.'),
  gender: z.enum(['Laki-laki', 'Perempuan']).describe('Gender of the student based on name or explicit mention.'),
});

const ExtractStudentsInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,...'"
    ),
});
export type ExtractStudentsInput = z.infer<typeof ExtractStudentsInputSchema>;

const ExtractStudentsOutputSchema = z.object({
  students: z.array(ExtractedStudentSchema).describe('A list of students extracted from the document.'),
});
export type ExtractStudentsOutput = z.infer<typeof ExtractStudentsOutputSchema>;

export async function extractStudentsFromPdf(input: ExtractStudentsInput): Promise<ExtractStudentsOutput> {
  return extractStudentsFromPdfFlow(input);
}

const extractStudentsPrompt = ai.definePrompt({
  name: 'extractStudentsPrompt',
  input: { schema: ExtractStudentsInputSchema },
  output: { schema: ExtractStudentsOutputSchema },
  prompt: `You are an expert school administrator. 
Analyze the provided PDF document and extract a list of all students mentioned. 
For each student, identify:
1. Full Name
2. NISN (National Student Identification Number)
3. Gender (infer from name if not explicitly stated: 'Laki-laki' for boys, 'Perempuan' for girls)

If the document contains a table, ensure you capture every row.

Document: {{media url=pdfDataUri}}`,
});

const extractStudentsFromPdfFlow = ai.defineFlow(
  {
    name: 'extractStudentsFromPdfFlow',
    inputSchema: ExtractStudentsInputSchema,
    outputSchema: ExtractStudentsOutputSchema,
  },
  async (input) => {
    const { output } = await extractStudentsPrompt(input);
    return output!;
  }
);
