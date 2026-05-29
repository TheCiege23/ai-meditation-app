import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateMeditation(mood) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `
Create a guided meditation script.

User mood: ${mood}

Include:
- breathing instructions
- calming visualization
- closing affirmation

Length: about 3 minutes of spoken meditation.
`
  });

  return response.output_text;
}