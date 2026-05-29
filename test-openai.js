import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: "Say: OpenAI local test successful.",
  });

  console.log(response.output_text);
}

testOpenAI().catch(console.error);