import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    console.log("\n--- AVAILABLE MODELS ---");
    data.models.forEach(model => {
      if (model.supportedGenerationMethods.includes("generateContent")) {
        console.log(`Model ID: ${model.name.replace('models/', '')}`);
        console.log(`Display Name: ${model.displayName}`);
        console.log(`Max Output Tokens: ${model.outputTokenLimit}`);
        console.log("------------------------");
      }
    });
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
