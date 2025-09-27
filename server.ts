import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { handleSms } from "./smsHandler";
dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/sms", async (req, res) => {
  const from = req.body.From;
  const body = req.body.Body || "";
  try {
    const twilioResponse = await handleSms(from, body);
    res.type("text/xml").send(twilioResponse);
  } catch (err) {
    console.error(err);
    res.status(500).send(`<Response><Message>Server error</Message></Response>`);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`POC server listening on ${port}`));
