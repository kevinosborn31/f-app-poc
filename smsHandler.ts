import { twiml as Twiml } from "twilio";
import { findOrCreateUserByPhone, addMeal } from "./db";
import { appendMealToSheet } from "./sheets";
import { simpleParseMeal } from "./mealParser";
import { askNutritionQuestion } from "./openaiClient";

export async function handleSms(from: string, body: string) {
  // from example: "whatsapp:+1234" or "+614..." — normalize
  const phone = from.replace("whatsapp:", "").trim();
  const user = findOrCreateUserByPhone(phone);

  // Simple detection: if message contains words like "ate", "had", contains numbers (grams) or common foods
  const mealKeywords = /(ate|had|breakfast|lunch|dinner|snack|cup|slice|g|grams|calorie|cal|kcal|bowl|piece)/i;
  const isMeal = mealKeywords.test(body) || body.split(" ").length <= 6 && /,/.test(body) === false ? mealKeywords.test(body) : mealKeywords.test(body);

  // Simpler rule: if message starts with "log" or "meal:" treat as meal
  if (/^\s*(log|meal|i ate|ate)/i.test(body) || mealKeywords.test(body)) {

    const parsed = simpleParseMeal(body);

    // Optionally call OpenAI to extract better structured info (calories estimate)
    // Minimal: we'll ask the model to output JSON for parsing (so user doesn't have to)
    try {
      const meal = addMeal(user.id, body, parsed, undefined);
      await appendMealToSheet([new Date().toISOString(), user.phone, body, JSON.stringify(parsed)]);
      const twiml = new Twiml.MessagingResponse();
      twiml.message(`Thanks — meal logged for ${user.phone}. If you'd like calorie estimates or advice about this meal, reply "analyze: <this meal>".`);
      return twiml.toString();
    } catch (err) {
      console.error("Error logging meal:", err);
      const t = new Twiml.MessagingResponse();
      t.message("Sorry — couldn't log your meal right now.");
      return t.toString();
    }
  } else {
    // treat as question
    try {
      const answer = await askNutritionQuestion(phone, body);
      const t = new Twiml.MessagingResponse();
      t.message(answer);
      return t.toString();
    } catch (err) {
      console.error("Error answering question:", err);
      const t = new Twiml.MessagingResponse();
      t.message("Sorry — couldn't generate an answer right now.");
      return t.toString();
    }
  }
}
