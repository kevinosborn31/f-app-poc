import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function askNutritionQuestion(phone: string, question: string) {
  // Minimal prompt
  const prompt = `
You are a registered dietitian assistant. A user asks: "${question}"
Respond concisely (2-4 short paragraphs), include evidence-aware phrasing ("based on general research..."), and give 3 practical next steps. If the question asks for a meal log or calories which are not clear, request a clearer meal description. Do not give medical diagnoses.
`;
  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini", 
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
  });
  return resp.choices?.[0]?.message?.content ?? "Sorry, no answer.";
}
