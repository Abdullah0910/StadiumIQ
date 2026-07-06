import React, { useState, useRef, useEffect } from 'react';
import { UserRole, ChatHistoryMessage } from '../types';
import { Send, Sparkles, AlertCircle, Bot, User, Trash2 } from 'lucide-react';

interface GeminiChatProps {
  role: UserRole;
}

export default function GeminiChat({ role }: GeminiChatProps) {
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am your Google Gemini-powered Smart Stadium Assistant. I see you are logged in as an **${role.toUpperCase()}**. Ask me any questions about stadium navigation, crowd optimization, or emergency operations!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Generate context chips based on active role
  const getSuggestionChips = (userRole: UserRole) => {
    switch (userRole) {
      case 'fan':
        return [
          'Where is the closest restroom with no line?',
          'Recommend a fast food court and show wait times',
          'Optimize my path to Gate 3 (South)',
          'When is the post-match award ceremony?'
        ];
      case 'volunteer':
        return [
          'Generate volunteer briefing for North Gate backlog',
          'What is the standard protocol for lost items?',
          'Summarize active tasks and priority items'
        ];
      case 'security':
        return [
          'Draft critical action plan for spill in Sector C',
          'Generate a mass evacuation alert message',
          'Explain crowd anomaly security protocol'
        ];
      case 'operations':
        return [
          'Analyze current stadium-wide bottlenecks',
          'Give energy sustainability tips for high solar gen',
          'Recommend gate re-routing for general public'
        ];
      case 'medical':
        return [
          'Quick route from Main Clinic to Sector A Seat 15',
          'Explain heat exhaustion standard rapid response',
          'Summarize active medical calls'
        ];
      default:
        return [
          'Give me general stadium information',
          'How is crowd flow regulated?'
        ];
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatHistoryMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          role: role,
          history: messages.map(m => ({
            role: m.sender === 'ai' ? 'model' : 'user',
            parts: [{ text: m.text }]
          }))
        })
      });

      const data = await response.json();
      if (data.isSimulated) {
        setIsSimulation(true);
      } else {
        setIsSimulation(false);
      }

      const aiMsg: ChatHistoryMessage = {
        id: Math.random().toString(),
        sender: 'ai',
        text: data.text || 'Sorry, I could not process that request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatHistoryMessage = {
        id: Math.random().toString(),
        sender: 'ai',
        text: 'An error occurred while communicating with Gemini. Running in local fallback state. Please check your network connection and server settings.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Chat reset. I am ready to support your operations as an **${role.toUpperCase()}**. How can I assist you?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-950/60 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-600/20 p-2 rounded-xl text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              Gemini AI Co-Pilot
              {isSimulation ? (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                  Simulation
                </span>
              ) : (
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium animate-pulse">
                  Live Key
                </span>
              )}
            </h4>
            <p className="text-[11px] text-indigo-300">Intelligent Operations Dispatcher</p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Clear Chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map(msg => {
          const isAi = msg.sender === 'ai';
          return (
            <div key={msg.id} className={`flex gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}>
              {isAi && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                isAi
                  ? 'bg-slate-800/80 text-slate-100 border border-slate-700/50 rounded-tl-none'
                  : 'bg-indigo-600 text-white rounded-tr-none'
              }`}>
                {/* Formatting bold text correctly */}
                <div className="whitespace-pre-wrap">
                  {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-indigo-300">{part}</strong> : part)}
                </div>
                <div className={`text-[9px] mt-1.5 text-right ${isAi ? 'text-slate-400' : 'text-indigo-200'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-semibold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800/50 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        {getSuggestionChips(role).map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750 text-[11px] rounded-full transition-colors shrink-0 cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Form Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2 items-center"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask Gemini anything as ${role}...`}
          className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Footer attribution */}
      <div className="bg-slate-950 py-1.5 px-3 border-t border-slate-900/50 flex justify-between items-center text-[9px] text-slate-500">
        <span>Insights generated by Google Gemini</span>
        <span className="flex items-center gap-1 text-indigo-400/80">
          <Sparkles className="w-2.5 h-2.5 animate-pulse" />
          gemini-3.5-flash
        </span>
      </div>
    </div>
  );
}
