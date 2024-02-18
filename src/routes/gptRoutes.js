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

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL_NAME = "gpt-4-0125-preview";

async function getPromptTemplate() {
  const filePath = path.join(__dirname, "../templates/prompt.txt");
  return fs.promises.readFile(filePath, "utf8");
}

async function getGPTResponse(data) {
  const apiKey = process.env["OPENAI_KEY"];
  const promptTemplate = await getPromptTemplate();
  const prompt = promptTemplate + data;
  const messages = [{ role: "user", content: prompt }];

  const params = {
    messages,
    model: MODEL_NAME,
    temperature: 0.0,
  };

  try {
    const response = await axios.post(OPENAI_URL, params, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to retrieve response from OpenAI.");
  }
}

router.post("/summary", async (req, res) => {
  try {
    const data = req.body.extractedData; // Accessing the 'extractedData' key
    const responseText = await getGPTResponse(data);

    console.log({
      name: "POST /summary",
      resultCode: 200,
      success: true,
    });

    res.json(JSON.parse(responseText));
  } catch (error) {
    console.error(error);
    console.log({
      name: "POST /summary",
      resultCode: 400,
      success: false,
    });
    res.status(400).json({ error: error.message });
  }
});

export default router;
