import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_FILE!;
const sheetId = process.env.GOOGLE_SHEET_ID!;

if (!credentialsPath || !sheetId) throw new Error("Google Sheets config missing");

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: SCOPES,
});
const sheets = google.sheets({ version: "v4", auth });

export async function appendMealToSheet(row: string[]) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Sheet1!A:Z",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  });
}
