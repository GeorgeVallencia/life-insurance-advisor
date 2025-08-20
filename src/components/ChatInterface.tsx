'use client';

//import { useLeadIntegration } from '@/hooks/useLeadIntegration';
import { useState, useRef, useEffect } from 'react';
import { Bot, Phone,FileText,Send, DollarSign } from "lucide-react";

// Define User interface inline
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface ChatInterfaceProps {
  user: User | null;
  sessionId: string;
  isGuestMode?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface UserProfile {
  age?: number;
  income?: number;
  dependents?: number;
  mortgage?: number;
  studentLoans?: number;
  maritalStatus?: string;
  gender?: 'male' | 'female';
  smoker?: boolean;
  state?: string;
  concerns?: string[];
}

interface Quote {
  carrier: string;
  monthlyPremium: number;
  annualPremium: number;
  coverageAmount: number;
  term: number;
  productName: string;
  quoteId: string;
}

// Simple icon components to replace lucide-react
const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BotIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DollarIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

export default function ChatInterface({ user, sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! 👋 I'm your personal life insurance advisor. I help people your age get the right coverage at the right price.\n\nMost people think life insurance costs 3x more than it actually does. What's your biggest question or concern about life insurance? Tell me about your life situation.",
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [currentSessionId, setCurrentSessionId] = useState<string>(sessionId || '');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', email: '', phone: '' });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Use passed sessionId or generate new one
    if (!currentSessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentSessionId(newSessionId);
    }
  }, [currentSessionId]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userProfile,
          sessionId: currentSessionId
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.userProfile) {
        setUserProfile(prev => ({ ...prev, ...data.userProfile }));
      }

      // Handle quotes
      if (data.quotes && data.quotes.length > 0) {
        setQuotes(data.quotes);
        setTimeout(() => {
          const quoteMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: generateQuoteDisplay(data.quotes, data.userProfile),
            timestamp: new Date()
          };
          setMessages(prev => [...prev, quoteMessage]);
        }, 1000);
      }

      // Show lead form if conversation is ready
      if (data.showLeadForm) {
        setTimeout(() => setShowLeadForm(true), 2000);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Can you try that again?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuoteDisplay = (quotes: Quote[], profile: UserProfile) => {
    const bestQuote = quotes[0];
    const avgQuote = quotes.length > 1 ? quotes[Math.floor(quotes.length / 2)] : bestQuote;
    
    return `🎯 **Great news! Here are your personalized quotes:**

**Best Rate: ${bestQuote.carrier}**
💰 **$${bestQuote.monthlyPremium}/month** for $${bestQuote.coverageAmount.toLocaleString()} coverage
📅 ${bestQuote.term}-year term

${quotes.length > 1 ? `**Compare with ${avgQuote.carrier}:** $${avgQuote.monthlyPremium}/month` : ''}

**Why this makes sense for you:**
✅ Covers ${profile.income ? Math.floor(bestQuote.coverageAmount / profile.income) : '7-10'} years of income replacement
${profile.mortgage ? `✅ Pays off your $${profile.mortgage.toLocaleString()} mortgage` : '✅ Covers major debts'}
${profile.dependents ? `✅ Protects your ${profile.dependents} dependent${profile.dependents > 1 ? 's' : ''}` : '✅ Provides peace of mind'}
✅ Final expenses covered ($15k+)

**Reality check:** You probably thought this would cost $${bestQuote.monthlyPremium * 3}+/month, right? 😊

Ready to move forward? I can connect you with a licensed agent to finalize your application!`;
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadData,
          sessionId: currentSessionId,
          userProfile,
          quotes: quotes.slice(0, 3) // Top 3 quotes
        })
      });

      setShowLeadForm(false);
      const confirmMessage: Message = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        content: `Perfect! 🎉 I've saved your information and quotes.\n\nA licensed insurance agent will contact you within 24 hours to help finalize your application.\n\nYour quotes are valid for 30 days, so no rush! Any other questions I can help with?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMessage]);
    } catch (error) {
      console.error('Lead submission error:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[800px] max-w-2xl mx-auto bg-white rounded-lg shadow-xl border">
      {/* Header */}
      <div className="p-4 border-b bg-green-700 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">Life Insurance Advisor</h2>
            <p className="text-blue-100 text-sm">Get personalized quotes in minutes</p>
          </div>
          <div className="text-blue-100 text-sm">
            Session: {currentSessionId.slice(-8)}
          </div>
        </div>
      </div>

      {/* User Profile Summary */}
      {(userProfile.age || userProfile.income) && (
        <div className="p-3 bg-blue-50 border-b text-sm">
          <div className="flex flex-wrap gap-4">
            {userProfile.age && <span>👤 Age: {userProfile.age}</span>}
            {userProfile.income && <span>💼 Income: ${userProfile.income.toLocaleString()}</span>}
            {userProfile.dependents && <span>👨‍👩‍👧‍👦 Dependents: {userProfile.dependents}</span>}
            {userProfile.mortgage && <span>🏠 Mortgage: ${userProfile.mortgage.toLocaleString()}</span>}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-green-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[85%] ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                {message.role === 'user' ? 
                  <UserIcon className="w-4 h-4 text-white" /> : 
                  <Bot className="w-4 h-4 text-white" />
                }
              </div>
              <div
                className={`p-4 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm '
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-bl-sm border shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">Getting your quotes...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Get Your Official Quotes</h3>
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={leadData.name}
                onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={leadData.email}
                onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={leadData.phone}
                onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                  Get Official Quotes
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeadForm(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Later
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex space-x-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about coverage amounts, costs, or anything else..."
            className="flex-1 p-3 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isLoading}
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send • All quotes from licensed carriers • Data secured & encrypted
        </div>
      </div>

      {/* Quick Action Buttons */}
      {quotes.length > 0 && (
        <div className="p-3 bg-gray-50 border-t">
          <div className="flex space-x-2 text-sm">
            <button 
              onClick={() => setShowLeadForm(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
            >
              <FileText className="w-3 h-3" />
              <span>Get Official Quotes</span>
            </button>
            <button className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200">
              <Phone className="w-3 h-3" />
              <span>Speak to Agent</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}