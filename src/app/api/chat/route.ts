import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion } from '@/lib/gemini'
import { db } from '@/lib/db';
import { InsuranceQuoteService } from '@/lib/insurance-apis';

const quoteService = new InsuranceQuoteService();

const GLOBAL_SYSTEM_PROMPT = `You are a friendly, expert life insurance advisor helping GenZ worldwide. You're knowledgeable but approachable, like a helpful friend who happens to be an insurance expert.

YOUR PERSONALITY:
- Warm, encouraging, and relatable
- Use conversational language, not sales-speak  
- Address their specific concerns directly
- Use analogies and examples they can relate to
- Be genuinely helpful, not pushy

YOUR GOALS:
1. Understand their situation through natural conversation
2. Extract key information: age, income, dependents, debts, concerns, gender, smoking status, country/region
3. Educate about life insurance costs and benefits
4. Address misconceptions with facts
5. Provide personalized guidance for ANY country
6. When ready, trigger quote generation (even if approximate)

KEY CONVERSATION FLOW:
1. Start by understanding their biggest concern/question
2. Ask follow-up questions about their situation naturally
3. Share relevant education as you learn about them
4. Address cost misconceptions early with examples
5. When you have enough info, offer to get quotes or estimates

IMPORTANT FACTS TO SHARE (ADAPT BY REGION):
- Term life insurance typically costs 1-3% of annual income for young, healthy adults
- Most people overestimate costs by 200-300% globally
- Employer coverage is usually insufficient (1-2x salary)
- Term life provides affordable temporary protection
- Quotes help you understand actual costs

HANDLING DIFFERENT COUNTRIES:
- For US customers: Provide specific US examples and trigger real quotes
- For other countries: Provide general guidance and estimated ranges
- Always be helpful regardless of location
- Suggest local research when specific quotes aren't available
- Give approximate cost ranges based on global averages

COST EXAMPLES BY REGION:
- US/Canada/Australia: $20-80/month for $250k-500k coverage (ages 25-35)
- Europe: €15-60/month for €200k-400k coverage  
- Developing countries: Often 2-5% of monthly income for 10-20x annual salary coverage
- Always emphasize: "less than many monthly subscriptions"

CONVERSATION STYLE:
- Keep responses under 150 words
- Ask ONE follow-up question per response
- Use relatable examples for their region
- Be encouraging: "You're smart to think about this!"
- Focus on protection for people they care about

When you have basic info (age, income, location), offer quotes/estimates regardless of country.

QUOTE TRIGGER: When user expresses interest in seeing quotes/estimates and you have age + income + location, respond with: "TRIGGER_QUOTES" at the end of your message.

For non-US customers, still trigger quotes to show estimated ranges and educational information.`;

// Types for better type safety
interface UserProfile {
  age?: number;
  income?: number;
  gender?: 'male' | 'female';
  smoker?: boolean;
  state?: string;
  maritalStatus?: string;
  dependents?: number;
  mortgage?: number;
  studentLoans?: number;
  country?: string;
  currency?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface QuoteRequest {
  age: number;
  gender: 'male' | 'female';
  smoker: boolean;
  coverageAmount: number;
  term: number;
  state: string;
  healthClass: 'preferred' | 'standard' | 'substandard';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, userProfile = {}, sessionId } = body;

    // Input validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('Chat API called with sessionId:', sessionId);

    // Get or create conversation record with better error handling
    const conversation = await getOrCreateConversation(sessionId, userProfile);

    // Generate AI response
    const response = await createChatCompletion([
      { role: "system", content: GLOBAL_SYSTEM_PROMPT },
      ...messages.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content
      }))
    ]);

    let assistantMessage = response?.message?.content || 
      "I'm sorry, I didn't catch that. Could you tell me more about your situation?";

    // Check if we should trigger quotes
    const shouldTriggerQuotes = assistantMessage.includes('TRIGGER_QUOTES');
    assistantMessage = assistantMessage.replace('TRIGGER_QUOTES', '').trim();

    // Extract and update profile information
    const updatedProfile = await extractProfileInfo(messages, userProfile);
    
    let quotes: Awaited<ReturnType<typeof quoteService.getAllQuotes>> = [];
    let showLeadForm = false;

    // Generate quotes if conditions are met
    if (shouldTriggerQuotes && isProfileReadyForQuotes(updatedProfile)) {
      const { quotes: generatedQuotes, showForm } = await generateQuotes(
        updatedProfile, 
        conversation?.id, 
        sessionId
      );
      quotes = generatedQuotes;
      showLeadForm = showForm;
    }

    // Save conversation data
    await saveConversationData(conversation, messages, assistantMessage, updatedProfile, sessionId);

    return NextResponse.json({
      message: assistantMessage,
      userProfile: updatedProfile,
      quotes,
      showLeadForm,
      metadata: { 
        quotesGenerated: quotes.length,
        conversationId: conversation?.id,
        databaseConnected: !!conversation,
        profileCompleteness: calculateProfileCompleteness(updatedProfile)
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // More specific error handling
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON format in request' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Sorry, I encountered an issue. Please try again.' },
      { status: 500 }
    );
  }
}

async function getOrCreateConversation(sessionId: string, userProfile: UserProfile) {
  try {
    let conversation = await db.conversation.findFirst({
      where: { sessionId }
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          sessionId,
          status: 'active',
          userProfile: userProfile || {}
        }
      });
      console.log('Created new conversation:', conversation.id);
    }

    return conversation;
  } catch (dbError) {
    console.error('Database error (non-critical):', dbError);
    return null;
  }
}

function isProfileReadyForQuotes(profile: UserProfile): boolean {
  return !!(profile.age && profile.income);
}

async function generateQuotes(
  profile: UserProfile, 
  conversationId: string | undefined, 
  sessionId: string
) {
  try {
    const coverageAmount = calculateCoverageNeed(profile);
    const quoteRequest: QuoteRequest = {
      age: profile.age!,
      gender: profile.gender || 'male',
      smoker: profile.smoker || false,
      coverageAmount,
      term: 20,
      state: profile.state || 'NY',
      healthClass: 'preferred' as const
    };

    const quotes = await quoteService.getAllQuotes(quoteRequest);
    
    // Save quotes to database if available
    if (conversationId && quotes.length > 0) {
      await saveQuotesToDatabase(quotes, sessionId, conversationId);
    }

    return { 
      quotes, 
      showForm: quotes.length > 0 
    };

  } catch (error) {
    console.error('Quote generation error:', error);
    return { quotes: [], showForm: false };
  }
}

async function saveQuotesToDatabase(quotes: any[], sessionId: string, conversationId: string) {
  try {
    const quotePromises = quotes.map(quote => 
      db.quote.create({
        data: {
          sessionId,
          conversationId,
          carrier: quote.carrier,
          monthlyPremium: quote.monthlyPremium,
          coverageAmount: quote.coverageAmount,
          term: quote.term,
          quoteData: quote
        }
      })
    );
    
    await Promise.all(quotePromises);
    console.log('Saved quotes to database:', quotes.length);
  } catch (dbError) {
    console.error('Failed to save quotes (non-critical):', dbError);
  }
}

async function saveConversationData(
  conversation: any,
  messages: ChatMessage[],
  assistantMessage: string,
  updatedProfile: UserProfile,
  sessionId: string
) {
  if (!conversation) return;

  try {
    // Save the current user message
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === 'user') {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: lastUserMessage.content,
          sessionId
        }
      });
    }

    // Save the assistant response
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantMessage,
        sessionId
      }
    });

    // Update conversation with latest profile
    await db.conversation.update({
      where: { id: conversation.id },
      data: { 
        userProfile: updatedProfile,
        updatedAt: new Date()
      }
    });

    // Sync profile to user record if user is logged in and profile has data
    if (conversation.userId && Object.keys(updatedProfile).length > 0) {
      await syncProfileToUser(conversation.userId, updatedProfile);
    }

    console.log('Messages and profile saved to database');
  } catch (dbError) {
    console.error('Failed to save messages (non-critical):', dbError);
  }
}

async function extractProfileInfo(messages: ChatMessage[], currentProfile: UserProfile): Promise<UserProfile> {
  const conversationText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join(' ');

  const profile: UserProfile = { ...currentProfile };

  // Extract age with improved regex
  const agePatterns = [
    /(?:i'm|i am|age|turned)\s*(\d{2})\s*(?:years?\s*old|yo|$)/,
    /(\d{2})\s*(?:years?\s*old|yo)/
  ];
  
  for (const pattern of agePatterns) {
    const match = conversationText.match(pattern);
    if (match) {
      const age = parseInt(match[1]);
      if (age >= 18 && age <= 80) {
        profile.age = age;
        break;
      }
    }
  }

  // Extract income with improved patterns and validation
  const incomePatterns = [
    /(?:make|earn|salary|income).*?[\$]?(\d+)k?(?:\s*(?:per\s*year|annually|a\s*year))?/g,
    /[\$]?(\d+)k?\s*(?:per\s*year|annually|salary|income)/g,
    /(\d+)k?\s*(?:dollar|usd|salary|income)/g
  ];
  
  for (const pattern of incomePatterns) {
    const matches = [...conversationText.matchAll(pattern)];
    for (const match of matches) {
      let income = parseInt(match[1]);
      
      // Handle 'k' notation (e.g., 50k = 50000)
      if (conversationText.includes(match[1] + 'k')) {
        income *= 1000;
      }
      
      // Validate income range
      if (income >= 20000 && income <= 2000000) {
        profile.income = income;
        break;
      }
    }
    if (profile.income) break;
  }

  // Extract gender with more patterns
  const genderIndicators = {
    female: ['female', 'woman', 'girl', 'she/her', 'lady'],
    male: ['male', 'man', 'guy', 'he/him', 'gentleman']
  };

  for (const [gender, indicators] of Object.entries(genderIndicators)) {
    if (indicators.some(indicator => conversationText.includes(indicator))) {
      profile.gender = gender as 'male' | 'female';
      break;
    }
  }

  // Extract smoking status with better context awareness
  const smokingPatterns = [
    { pattern: /(?:don't smoke|non-smoker|never smoked|quit smoking)/, value: false },
    { pattern: /(?:smoke|smoker|cigarette)/, value: true }
  ];

  for (const { pattern, value } of smokingPatterns) {
    if (pattern.test(conversationText)) {
      profile.smoker = value;
      break;
    }
  }

  // Extract location/state with expanded patterns
  const locationPatterns = [
    /(?:live in|from|in|located in)\s*([A-Z]{2}|california|new york|texas|florida|illinois|ohio|georgia)/i,
    /([A-Z]{2})\s*(?:state|area)/i
  ];

  for (const pattern of locationPatterns) {
    const match = conversationText.match(pattern);
    if (match) {
      let state = match[1].toUpperCase();
      
      // Convert full state names to abbreviations
      const stateMap: { [key: string]: string } = {
        'CALIFORNIA': 'CA', 'NEW YORK': 'NY', 'TEXAS': 'TX',
        'FLORIDA': 'FL', 'ILLINOIS': 'IL', 'OHIO': 'OH',
        'GEORGIA': 'GA'
      };
      
      profile.state = stateMap[state] || (state.length === 2 ? state : 'NY');
      break;
    }
  }

  // Extract country information
  const countryPatterns = [
    /(?:live in|from|in|located in)\s*(canada|uk|united kingdom|australia|germany|france|italy|spain|netherlands|india|japan|china|brazil|mexico)/i,
    /(?:i'm from|from)\s*(canada|uk|united kingdom|australia|germany|france|italy|spain|netherlands|india|japan|china|brazil|mexico)/i
  ];

  for (const pattern of countryPatterns) {
    const match = conversationText.match(pattern);
    if (match) {
      const countryMap: { [key: string]: string } = {
        'CANADA': 'CA',
        'UK': 'GB',
        'UNITED KINGDOM': 'GB',
        'AUSTRALIA': 'AU',
        'GERMANY': 'DE',
        'FRANCE': 'FR',
        'ITALY': 'IT',
        'SPAIN': 'ES',
        'NETHERLANDS': 'NL',
        'INDIA': 'IN',
        'JAPAN': 'JP',
        'CHINA': 'CN',
        'BRAZIL': 'BR',
        'MEXICO': 'MX'
      };
      
      const country = match[1].toUpperCase();
      profile.country = countryMap[country] || country;
      
      // If no state is set but country is US, don't override
      if (profile.country !== 'US' && profile.country !== 'USA') {
        profile.state = undefined; // Clear state for non-US countries
      }
      break;
    }
  }

  // Default to US if no country specified but state is provided
  if (profile.state && !profile.country) {
    profile.country = 'US';
  }

  // Extract family information with improved patterns
  const familyPatterns = [
    { pattern: /(\d+)\s*(?:kids?|children|dependents)/, key: 'dependents' },
    { pattern: /married|spouse|partner|wife|husband/, key: 'maritalStatus', value: 'married' },
    { pattern: /single|unmarried|not married/, key: 'maritalStatus', value: 'single' }
  ];

  for (const { pattern, key, value } of familyPatterns) {
    const match = conversationText.match(pattern);
    if (match) {
      if (key === 'dependents') {
        profile.dependents = parseInt(match[1]);
      } else {
        (profile as any)[key] = value;
        // If married and no dependents specified, assume at least spouse
        if (key === 'maritalStatus' && value === 'married' && !profile.dependents) {
          profile.dependents = 1;
        }
      }
    }
  }

  // Extract debt information with validation
  const debtPatterns = [
    { pattern: /mortgage.*?[\$]?(\d+)k?|house.*?owe.*?[\$]?(\d+)k?/, key: 'mortgage', min: 50000, max: 2000000 },
    { pattern: /student.*?loan.*?[\$]?(\d+)k?|loan.*?[\$]?(\d+)k?/, key: 'studentLoans', min: 5000, max: 500000 }
  ];

  for (const { pattern, key, min, max } of debtPatterns) {
    const match = conversationText.match(pattern);
    if (match) {
      let amount = parseInt(match[1] || match[2]);
      
      // Handle 'k' notation
      if (amount < 1000 && conversationText.includes('k')) {
        amount *= 1000;
      }
      
      if (amount >= min && amount <= max) {
        (profile as any)[key] = amount;
      }
    }
  }

  return profile;
}

function calculateCoverageNeed(profile: UserProfile): number {
  let baseNeed = 0;
  
  // Income replacement calculation
  if (profile.income) {
    // Use higher multiplier for people with more dependents
    const multiplier = (profile.dependents || 0) > 1 ? 12 : 
                      (profile.dependents || 0) === 1 ? 10 : 8;
    baseNeed += profile.income * multiplier;
  } else {
    // Default assumption for young adults
    baseNeed += 400000;
  }
  
  // Add existing debts
  baseNeed += (profile.mortgage || 0);
  baseNeed += (profile.studentLoans || 0);
  
  // Add final expenses
  baseNeed += 30000;
  
  // Additional coverage for dependents (education, childcare)
  if (profile.dependents && profile.dependents > 0) {
    baseNeed += profile.dependents * 150000; // $150k per dependent
  }
  
  // Ensure minimum coverage
  baseNeed = Math.max(baseNeed, 250000);
  
  // Round to nearest 25k for cleaner quotes
  return Math.round(baseNeed / 25000) * 25000;
}

function calculateProfileCompleteness(profile: UserProfile): number {
  const requiredFields = ['age', 'income', 'gender', 'state'];
  const optionalFields = ['smoker', 'dependents', 'maritalStatus', 'mortgage', 'studentLoans'];
  
  const requiredScore = requiredFields.reduce((score, field) => {
    return score + ((profile as any)[field] ? 0.6 / requiredFields.length : 0);
  }, 0);
  
  const optionalScore = optionalFields.reduce((score, field) => {
    return score + ((profile as any)[field] !== undefined ? 0.4 / optionalFields.length : 0);
  }, 0);
  
  return Math.round((requiredScore + optionalScore) * 100);
}

// Helper function to get currency based on country
function getCurrencyForCountry(country: string): string {
  const currencyMap: { [key: string]: string } = {
    'US': 'USD',
    'USA': 'USD',
    'United States': 'USD',
    'CA': 'CAD',
    'Canada': 'CAD',
    'UK': 'GBP',
    'United Kingdom': 'GBP',
    'GB': 'GBP',
    'AU': 'AUD',
    'Australia': 'AUD',
    'DE': 'EUR',
    'Germany': 'EUR',
    'FR': 'EUR',
    'France': 'EUR',
    'IT': 'EUR',
    'Italy': 'EUR',
    'ES': 'EUR',
    'Spain': 'EUR',
    'NL': 'EUR',
    'Netherlands': 'EUR',
    'IN': 'INR',
    'India': 'INR',
    'JP': 'JPY',
    'Japan': 'JPY',
    'CN': 'CNY',
    'China': 'CNY',
    'BR': 'BRL',
    'Brazil': 'BRL',
    'MX': 'MXN',
    'Mexico': 'MXN',
  };
  
  return currencyMap[country] || 'USD'; // Default to USD
}

// Helper function to sync profile data to user record
async function syncProfileToUser(userId: string, updatedProfile: UserProfile) {
  try {
    // Only update fields that have values (don't overwrite with undefined)
    const updateData: any = {
      updatedAt: new Date()
    };

    // Add profile fields if they exist
    if (updatedProfile.age !== undefined) updateData.age = updatedProfile.age;
    if (updatedProfile.income !== undefined) updateData.income = updatedProfile.income;
    if (updatedProfile.state !== undefined) updateData.state = updatedProfile.state;
    if (updatedProfile.country !== undefined) {
      updateData.country = updatedProfile.country;
      updateData.currency = getCurrencyForCountry(updatedProfile.country);
    }
    if (updatedProfile.gender !== undefined) updateData.gender = updatedProfile.gender;
    if (updatedProfile.smoker !== undefined) updateData.smoker = updatedProfile.smoker;
    if (updatedProfile.maritalStatus !== undefined) updateData.maritalStatus = updatedProfile.maritalStatus;
    if (updatedProfile.dependents !== undefined) updateData.dependents = updatedProfile.dependents;
    if (updatedProfile.mortgage !== undefined) updateData.mortgage = updatedProfile.mortgage;
    if (updatedProfile.studentLoans !== undefined) updateData.studentLoans = updatedProfile.studentLoans;

    // Update the user's profile with extracted information
    await db.user.update({
      where: { id: userId },
      data: updateData
    });
    
    console.log('Synced profile to user record');
  } catch (syncError) {
    console.error('Failed to sync profile to user (non-critical):', syncError);
  }
}