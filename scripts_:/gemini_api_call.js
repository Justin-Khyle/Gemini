// scripts_/gemini_api_call.js

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

// API SECRET
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Create a Gemini Client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Calls the Gemini API with user query and optional conversation history
 * @param {string} user_query - The user's question
 * @param {Array} conversation_history - Previous messages for context
 * @returns {string} JSON response from Gemini
 */
export async function gemini_api_call(user_query, conversation_history = []) {
    try {
        // Get the generative model
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
        
        // Prepare chat history if provided
        let chat;
        if (conversation_history && conversation_history.length > 0) {
            chat = model.startChat({
                history: conversation_history.map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.content }]
                }))
            });
            
            const result = await chat.sendMessage(user_query);
            return JSON.stringify({ response: result }, null, 2);
        } else {
            // For single queries without chat history
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: user_query }] }]
            });
            
            return JSON.stringify({ response: result }, null, 2);
        }
    } catch (error) {
        console.error("Error in Gemini API call:", error);
        throw new Error(`Failed to get response from Gemini: ${error.message}`);
    }
}