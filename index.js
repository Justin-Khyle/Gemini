// index.js (Main server file)

import express from 'express';
import { gemini_api_call } from './scripts_/gemini_api_call.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for Gemini
app.post('/gemini', async (req, res) => {
    try {
        const { userQuery, conversationHistory } = req.body;

        if (!userQuery) {
            return res.status(400).json({ error: 'No query provided' });
        }

        // Call Gemini API with conversation history for context
        const response = await gemini_api_call(userQuery, conversationHistory);
        
        // Parse the response to extract just the text content
        const parsedResponse = JSON.parse(response);
        const textResponse = parsedResponse.response.candidates[0].content.parts[0].text;
        
        // Send only the text response to client
        res.json({ 
            text: textResponse,
            fullResponse: parsedResponse // Optional: include full response for debugging
        });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ 
            error: 'Error processing your request', 
            details: error.message
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Access the app at http://localhost:${PORT}`);
});