import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const router = express.Router();

router.use(express.text());

// OPENAI API - GPT SUMMARY
router.post("/summary", async (req, res) => {
  try {
    const data = req.body.extractedData; // Accessing the 'extractedData' key
    const response_text = await GetGPTResponse(data);
    res.json(JSON.parse(response_text));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

async function GetGPTResponse(data) {
  const apiKey = process.env["OPENAI_KEY"];

  const client = axios.create({
    headers: {
      Authorization: "Bearer " + apiKey,
    },
  });

  const file = fs.readFileSync(
    path.join(__dirname, "../templates/prompt.txt"),
    "utf8"
  );

  const prompt = file + data;
  const messages = [{ role: "user", content: prompt }];

  const params = {
    messages: messages,
    model: "gpt-4",
    temperature: 0.0,
  };

  const response = await client.post(
    "https://api.openai.com/v1/chat/completions",
    params
  );

  return response.data.choices[0].message.content;
}

export default router;
