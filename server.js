import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// In-memory chat history: { sessionId: [ {role, content}, ... ] }
const sessions = {};

app.post("/roast", async (req, res) => {
  const { sessionId, userInput } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  if (!sessions[sessionId]) sessions[sessionId] = [];

  // Add user message to history
  sessions[sessionId].push({ role: "user", content: userInput });

  try {
    // Use a valid Groq model, fallback to 'groq/compound' if not set
    const model = process.env.GROQ_MODEL || "groq/compound";

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model,
        messages: [
          {
            role: "system",
            content:
              "You are RoastBot: a savage Hinglish comedian. you can reply in english and hinglish based on what the user has used. " +
              "Always roast brutally with Hinglish slang, memes, and sarcasm. think 2 times about what the user has input, read carefully what the user has said to you. make sure to check about whom the user is talking. teri implies it's you and meri implies the user" +
              "Never repeat insults. Keep it short, witty, unpredictable. " +
              "You must respond ONLY with roasts that are at max 2-3 lines, no explanations."
          },
          ...sessions[sessionId],
        ],
        temperature: 0.9,
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const roast = response.data.choices[0]?.message?.content || "Kya bakwaas input tha!";

    // Add roast to history
    sessions[sessionId].push({ role: "assistant", content: roast });

    res.json({ roast });
  } catch (err) {
    // Surface Groq API error body and status for debugging
    const apiError = err.response?.data || { message: err.message };
    console.error("Groq API error:", apiError);
    res.status(err.response?.status || 500).json({
      error: apiError,
      model: process.env.GROQ_MODEL || "groq/compound"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RoastBot running at http://localhost:${PORT}`));
