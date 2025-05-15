// public/js/frontendScript.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const userInput = document.getElementById('userInput');
    const submitButton = document.getElementById('submit');
    const conversationDiv = document.getElementById('conversation');
    const clearChatButton = document.getElementById('clearChat');
    const saveChatButton = document.getElementById('saveChat');
    const keepContextCheckbox = document.getElementById('keepContext');
    const recentQuestionsList = document.getElementById('recentQuestions');
    const topicTags = document.querySelectorAll('.topic-tag');
    
    // State management
    let conversationHistory = [];
    let recentQuestions = [];
    
    // Load conversation from localStorage if exists
    function loadConversation() {
        const savedConversation = localStorage.getItem('geminiConversation');
        const savedQuestions = localStorage.getItem('recentQuestions');
        
        if (savedConversation) {
            conversationHistory = JSON.parse(savedConversation);
            
            // Render saved messages
            conversationHistory.forEach(msg => {
                appendMessage(msg.content, msg.role === 'user' ? 'user' : 'gemini');
            });
        }
        
        if (savedQuestions) {
            recentQuestions = JSON.parse(savedQuestions);
            updateRecentQuestionsList();
        }
    }
    
    // Initialize the app
    function init() {
        loadConversation();
        userInput.focus();
        
        // Pre-defined study topics click handlers
        topicTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const topic = tag.getAttribute('data-topic');
                let prompt = '';
                
                switch(topic) {
                    case 'Definitions':
                        prompt = 'Explain the key definitions and concepts for my exam topic: ';
                        break;
                    case 'Formulas':
                        prompt = 'What are the important formulas I need to know for: ';
                        break;
                    case 'Examples':
                        prompt = 'Can you provide some detailed examples of: ';
                        break;
                    case 'Practice Problems':
                        prompt = 'Generate practice problems with solutions for: ';
                        break;
                }
                
                userInput.value = prompt;
                userInput.focus();
            });
        });
    }
    
    // Send message to Gemini API
    async function sendToGemini(userQuery) {
        if (!userQuery.trim()) return;
        
        // Add user message to UI
        appendMessage(userQuery, 'user');
        
        // Add to conversation history
        conversationHistory.push({
            role: 'user',
            content: userQuery
        });
        
        // Show typing indicator
        showTypingIndicator();
        
        // Add to recent questions
        addToRecentQuestions(userQuery);
        
        try {
            // Prepare request payload
            const payload = {
                userQuery: userQuery,
                conversationHistory: keepContextCheckbox.checked ? conversationHistory : []
            };
            
            // Make API request
            const response = await fetch('/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            
            // Process response
            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add gemini response to UI
            appendMessage(data.text, 'gemini');
            
            // Add to conversation history
            conversationHistory.push({
                role: 'model',
                content: data.text
            });
            
            // Save to localStorage
            saveConversation();
            
        } catch (error) {
            console.error('Error during fetch:', error);
            removeTypingIndicator();
            appendMessage('Error: ' + error.message, 'gemini error');
        }
        
        // Clear input field
        userInput.value = '';
    }
    
    // Append a message to the conversation
    function appendMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        
        // Format code blocks if present
        let formattedContent = formatCodeBlocks(content);
        
        // Apply markdown formatting
        formattedContent = formatMarkdown(formattedContent);
        
        messageDiv.innerHTML = formattedContent;
        
        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.classList.add('timestamp');
        timestamp.textContent = new Date().toLocaleTimeString();
        messageDiv.appendChild(timestamp);
        
        conversationDiv.appendChild(messageDiv);
        
        // Scroll to bottom
        conversationDiv.scrollTop = conversationDiv.scrollHeight;
    }
    
    // Format code blocks
    function formatCodeBlocks(text) {
        // Replace ```language code``` with <pre><code>code</code></pre>
        return text.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    }
    
    // Format basic markdown
    function formatMarkdown(text) {
        // Bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Headers
        text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        // Lists
        text = text.replace(/^\- (.*?)$/gm, '<li>$1</li>');
        // Paragraphs
        text = text.replace(/\n\n/g, '<br><br>');
        
        return text;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        conversationDiv.appendChild(typingDiv);
        conversationDiv.scrollTop = conversationDiv.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingDiv = document.getElementById('typingIndicator');
        if (typingDiv) {
            typingDiv.remove();
        }
    }
    
    // Add to recent questions
    function addToRecentQuestions(question) {
        // Only keep unique questions and limit to 5 recent ones
        if (!recentQuestions.includes(question)) {
            recentQuestions.unshift(question);
            if (recentQuestions.length > 5) {
                recentQuestions.pop();
            }
            localStorage.setItem('recentQuestions', JSON.stringify(recentQuestions));
            updateRecentQuestionsList();
        }
    }
    
    // Update recent questions list in UI
    function updateRecentQuestionsList() {
        recentQuestionsList.innerHTML = '';
        recentQuestions.forEach(question => {
            const li = document.createElement('li');
            li.textContent = question.length > 30 ? question.substring(0, 30) + '...' : question;
            li.title = question;
            li.addEventListener('click', () => {
                userInput.value = question;
                userInput.focus();
            });
            recentQuestionsList.appendChild(li);
        });
    }
    
    // Save conversation to localStorage
    function saveConversation() {
        localStorage.setItem('geminiConversation', JSON.stringify(conversationHistory));
    }
    
    // Event listeners
    submitButton.addEventListener('click', () => {
        sendToGemini(userInput.value.trim());
    });
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendToGemini(userInput.value.trim());
        }
    });
    
    clearChatButton.addEventListener('click', () => {
        conversationDiv.innerHTML = '';
        conversationHistory = [];
        localStorage.removeItem('geminiConversation');
    });
    
    saveChatButton.addEventListener('click', () => {
        // Create text version of conversation for download
        let conversationText = 'Gemini AI Exam Assistant - Chat Log\n';
        conversationText += '========================================\n\n';
        
        conversationHistory.forEach((msg, index) => {
            conversationText += `${msg.role === 'user' ? 'You' : 'Gemini'}: ${msg.content}\n\n`;
        });
        
        // Create and trigger download
        const blob = new Blob([conversationText], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'gemini-exam-chat.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
    
    // Initialize the app
    init();
});