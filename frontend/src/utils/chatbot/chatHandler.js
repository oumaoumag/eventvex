import { getEventTicketingResponses } from './responses.js';

/**
 * Processes a chatbot query and returns the appropriate response
 * @param {string} message - The user's message
 * @param {string} userId - Optional user ID for tracking conversation context
 * @returns {Promise<string>} - The chatbot's response
 */
export async function handleChatbotQuery(message, userId = null) {
  // Normalize the query for better matching
  const query = message.toLowerCase().trim();
  
  // Get all possible responses from the data file
  const responses = getEventTicketingResponses();
  
  // Initialize context tracking (can be expanded in future versions)
  let conversationContext = userId ? getUserConversationContext(userId) : { recentTopics: [] };
  
  // Parse the query to understand user intent
  const parsedIntent = parseQueryIntent(query);
  
  // If we detect a greeting with a question, prioritize answering the question
  if (parsedIntent.greeting && parsedIntent.otherIntents.length > 0) {
    // Start with a greeting but then answer the question
    const greetingResponse = responses.shortGreetings[Math.floor(Math.random() * responses.shortGreetings.length)];
    const questionResponse = await getResponseForIntent(parsedIntent.otherIntents[0], query, responses);
    return `${greetingResponse} ${questionResponse}`;
  }
  
  // If it's just a greeting, respond with a friendly greeting
  if (parsedIntent.greeting && parsedIntent.otherIntents.length === 0) {
    return responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
  }
  
  // If we have multiple intents, try to address all of them
  if (parsedIntent.otherIntents.length > 1) {
    let combinedResponse = "";
    for (const intent of parsedIntent.otherIntents.slice(0, 2)) { // Limit to 2 intents to keep response reasonable
      const intentResponse = await getResponseForIntent(intent, query, responses);
      combinedResponse += intentResponse + "\n\n";
    }
    return combinedResponse.trim();
  }
  
  // Handle single intent
  if (parsedIntent.otherIntents.length === 1) {
    return await getResponseForIntent(parsedIntent.otherIntents[0], query, responses);
  }
  
  // If no clear intent is found, try to match with specific event questions
  for (const event of Object.keys(responses.events)) {
    if (containsPhrase(query, event)) {
      return responses.events[event];
    }
  }
  
  // Still no match? Try checking for keywords in the query to provide a relevant response
  const relevantKeywords = findRelevantKeywords(query, responses);
  if (relevantKeywords.length > 0) {
    // Find the most relevant intent based on keyword matches
    const bestIntent = findBestIntentMatch(relevantKeywords, responses);
    if (bestIntent) {
      return await getResponseForIntent(bestIntent, query, responses);
    }
  }
  
  // If we still can't match, use a smart fallback response
  return getSmartFallbackResponse(query, responses);
}

/**
 * Gets a response for a specific intent
 * @param {string} intent - The detected intent
 * @param {string} query - The original query
 * @param {Object} responses - Response data
 * @returns {Promise<string>} - The response
 */
async function getResponseForIntent(intent, query, responses) {
  // Check if this is a specific intent we have detailed responses for
  if (responses.intents[intent]) {
    const intentData = responses.intents[intent];
    
    // Check if we need to extract specific details from the query
    if (intentData.requiresEntityExtraction) {
      const extractedEntities = extractEntitiesFromQuery(query, intent);
      
      // If we have a template response that uses extracted entities
      if (extractedEntities && intentData.templateResponse) {
        return formatTemplateResponse(intentData.templateResponse, extractedEntities);
      }
    }
    
    // For question-specific responses
    for (const questionPattern of Object.keys(intentData.questionResponses || {})) {
      if (containsPhrase(query, questionPattern)) {
        return intentData.questionResponses[questionPattern];
      }
    }
    
    // If we have multiple contextual responses, select the most appropriate one
    if (Array.isArray(intentData.responses)) {
      if (query.includes('how') || query.includes('process') || query.includes('steps')) {
        // User is asking about a process, prioritize step-by-step responses
        const processResponses = intentData.responses.filter(r => r.includes('1.') || r.includes('Step'));
        if (processResponses.length > 0) {
          return processResponses[0];
        }
      }
      
      // Default to returning the first (usually most comprehensive) response
      return intentData.responses[0];
    }
  }
  
  // Fallback to a generic response for this intent
  return `I can help you with information about ${intent.replace(/_/g, ' ')}. What specifically would you like to know?`;
}

/**
 * Parse the query to understand user intent
 * @param {string} query - The user's query
 * @returns {Object} - Object containing detected intents
 */
function parseQueryIntent(query) {
  const result = {
    greeting: false,
    otherIntents: []
  };
  
  // Check for greetings
  const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'howdy'];
  if (greetings.some(greeting => query.startsWith(greeting))) {
    result.greeting = true;
    // Remove the greeting to analyze the rest of the query
    for (const greeting of greetings) {
      if (query.startsWith(greeting)) {
        query = query.substring(greeting.length).trim();
        break;
      }
    }
  }
  
  // Map of intent patterns to check
  const intentPatterns = {
    'ticket_purchase': ['buy ticket', 'purchase ticket', 'get ticket', 'how to buy', 'ticket price', 'cost of ticket', 'how do i purchase', 'how can i buy'],
    'wallet_connection': ['connect wallet', 'wallet connection', 'metamask', 'how to connect', 'wallet issue', 'link wallet', 'attach wallet'],
    'ticket_transfer': ['transfer ticket', 'send ticket', 'give ticket', 'ticket to friend', 'share ticket'],
    'ticket_resale': ['resell ticket', 'sell ticket', 'ticket marketplace', 'secondary market', 'sell my ticket'],
    'event_creation': ['create event', 'host event', 'make event', 'sell my tickets', 'organize event', 'start event'],
    'ticket_validation': ['validate ticket', 'scan ticket', 'ticket qr', 'use ticket', 'enter event', 'check-in'],
    'technical_support': ['problem', 'issue', 'help me', 'not working', 'error', 'trouble', 'support', 'bug', 'fix']
  };
  
  // Check for question patterns
  const questionPatterns = [
    { regex: /how (do|can|to) .* (ticket|event|wallet|purchase|buy|sell)/i, intent: null },
    { regex: /what (is|are) .* (ticket|event|price|cost|fee)/i, intent: null },
    { regex: /where .* (ticket|event|purchase|buy|sell)/i, intent: null },
    { regex: /when .* (ticket|event)/i, intent: null },
    { regex: /can i .* (ticket|event|wallet|purchase|buy|sell)/i, intent: null }
  ];
  
  // Check for each intent
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    if (patterns.some(pattern => containsPhrase(query, pattern))) {
      result.otherIntents.push(intent);
    }
  }
  
  // If no intent was matched with direct patterns, try question patterns
  if (result.otherIntents.length === 0) {
    for (const pattern of questionPatterns) {
      if (pattern.regex.test(query)) {
        // Try to determine the intent from the question context
        if (containsPhrase(query, 'ticket') && containsPhrase(query, 'buy', 'purchase', 'get')) {
          result.otherIntents.push('ticket_purchase');
        } else if (containsPhrase(query, 'wallet', 'connect', 'metamask')) {
          result.otherIntents.push('wallet_connection');
        } else if (containsPhrase(query, 'ticket') && containsPhrase(query, 'sell', 'resell', 'resale')) {
          result.otherIntents.push('ticket_resale');
        } else if (containsPhrase(query, 'event') && containsPhrase(query, 'create', 'host', 'organize')) {
          result.otherIntents.push('event_creation');
        } else if (containsPhrase(query, 'ticket') && (containsPhrase(query, 'scan') || containsPhrase(query, 'validate') || containsPhrase(query, 'entry'))) {
          result.otherIntents.push('ticket_validation');
        }
      }
    }
  }
  
  return result;
}

/**
 * Check if a string contains any of the specified phrases
 * @param {string} text - Text to check
 * @param {...string} phrases - Phrases to look for
 * @returns {boolean} - True if any phrase is found
 */
function containsPhrase(text, ...phrases) {
  return phrases.some(phrase => text.includes(phrase));
}

/**
 * Extract relevant keywords from a query
 * @param {string} query - The user's query
 * @param {Object} responses - Response data
 * @returns {Array<Object>} - Extracted keywords
 */
function findRelevantKeywords(query, responses) {
  const relevantKeywords = [];
  
  // Go through each intent and check for keyword matches
  for (const [intent, intentData] of Object.entries(responses.intents)) {
    if (intentData.keywords) {
      for (const keyword of intentData.keywords) {
        // Check if keyword exists in the query
        if (query.includes(keyword)) {
          relevantKeywords.push({
            intent,
            keyword,
            // Calculate a simple relevance score (can be improved)
            relevance: keyword.length / query.length
          });
        }
      }
    }
  }
  
  // Sort by relevance (higher score first)
  return relevantKeywords.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Find the best intent match based on keyword matches
 * @param {Array<Object>} keywordMatches - Keyword matches
 * @param {Object} responses - Response data
 * @returns {string|null} - Best matching intent or null
 */
function findBestIntentMatch(keywordMatches, responses) {
  if (keywordMatches.length === 0) return null;
  
  // Group by intent
  const intentScores = {};
  for (const match of keywordMatches) {
    if (!intentScores[match.intent]) {
      intentScores[match.intent] = 0;
    }
    intentScores[match.intent] += match.relevance;
  }
  
  // Find intent with highest cumulative score
  let bestIntent = null;
  let bestScore = 0;
  
  for (const [intent, score] of Object.entries(intentScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }
  
  return bestIntent;
}

/**
 * Generate a smart fallback response based on query analysis
 * @param {string} query - The user's query
 * @param {Object} responses - Response data
 * @returns {string} - Fallback response
 */
function getSmartFallbackResponse(query, responses) {
  // If the query is very short (less than 3 words)
  const wordCount = query.split(' ').length;
  
  if (wordCount < 3) {
    return "I need a bit more information to help you properly. Could you please elaborate on your question about EventVax's services?";
  }
  
  // If it looks like a help request
  if (isHelpRequest(query)) {
    return responses.help;
  }
  
  // Default to a random fallback response
  const fallbackIndex = Math.floor(Math.random() * responses.fallback.length);
  return responses.fallback[fallbackIndex];
}

/**
 * Checks if a message is a greeting
 * @param {string} message - The user's message
 * @returns {boolean} - Whether the message is a greeting
 */
function isGreeting(message) {
  const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
  return greetings.some(greeting => message.startsWith(greeting));
}

/**
 * Checks if a message is a help request
 * @param {string} message - The user's message
 * @returns {boolean} - Whether the message is a help request
 */
function isHelpRequest(message) {
  return message.includes('help') || message.includes('assist') || message.includes('support') || 
         message.includes('what can you do') || message.includes('how to use');
}

/**
 * Gets the conversation context for a user (placeholder for future implementation)
 * @param {string} userId - The user's ID
 * @returns {Object} - The user's conversation context
 */
function getUserConversationContext(userId) {
  // In a real implementation, this would fetch context from a database or state management
  // For now, just return a simple context object
  return {
    recentTopics: [],
    preferredResponseStyle: 'detailed',
    lastInteraction: new Date().toISOString()
  };
}
