import { twiml as Twiml } from "twilio";
import { findOrCreateUserByPhone, addMeal } from "./db";
import { appendMealToSheet } from "./sheets";
import { simpleParseMeal } from "./mealParser";
import { askNutritionQuestion } from "./openaiClient";

export async function handleSms(from: string, body: string) {
  const phone = from.replace("whatsapp:", "").trim();

  // ensure we wait for DB operations
  const user = await findOrCreateUserByPhone(phone);

  // detect if it's a meal
  const mealKeywords =
    /(ate|had|breakfast|lunch|dinner|snack|cup|slice|g|grams|calorie|cal|kcal|bowl|piece)/i;

  const isMeal =
    /^\s*(log|meal|i ate|ate)/i.test(body) ||
    mealKeywords.test(body) ||
    (body.split(" ").length <= 6 && !/,/.test(body) && mealKeywords.test(body));

  const twiml = new Twiml.MessagingResponse();

  if (isMeal) {
    try {
      const parsed = simpleParseMeal(body);

      const meal = await addMeal(user.id, body, parsed, undefined);

      await appendMealToSheet([
        new Date().toISOString(),
        user.phone,
        body,
        JSON.stringify(parsed),
      ]);

      twiml.message(
        `Thanks — meal logged for ${user.phone}. If you'd like calorie estimates or advice about this meal, reply "analyze: <this meal>".`
      );

      return twiml.toString();
    } catch (err) {
      console.error("Error logging meal:", err, { phone, body });
      twiml.message("Sorry — couldn't log your meal right now.");
      return twiml.toString();
    }
  } else {
    try {
      const answer = await askNutritionQuestion(phone, body);
      twiml.message(answer);
      return twiml.toString();
    } catch (err) {
      console.error("Error answering question:", err, { phone, body });
      twiml.message("Sorry — couldn't generate an answer right now.");
      return twiml.toString();
    }
  }
}
