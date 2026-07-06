import React, { useState } from 'react';
import { StadiumLocation, MatchSchedule } from '../types';
import { MapPin, Sparkles, Navigation, Flame, ShieldAlert, Utensils, Globe, HelpCircle } from 'lucide-react';
import { sanitizeInput } from '../utils/security';

interface FanDashboardProps {
  locations: StadiumLocation[];
  matches: MatchSchedule[];
  onTriggerRoute: (startSeat: string, destId: string, accessibility: string) => void;
  selectedLocation: StadiumLocation | null;
}

export default function FanDashboard({
  locations,
  matches,
  onTriggerRoute,
  selectedLocation
}: FanDashboardProps) {
  const [startSeat, setStartSeat] = useState('Sector A Row 10');
  const [selectedDest, setSelectedDest] = useState('restroom-1');
  const [accessibility, setAccessibility] = useState('none');
  const [translationText, setTranslationText] = useState('Please proceed to South Gate for rapid exit after the game.');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [translatedResult, setTranslatedResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Match Insights State
  const [matchInsights, setMatchInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Quick select destination
  const toilets = React.useMemo(() => locations.filter(l => l.type === 'restroom'), [locations]);
  const foodCourts = React.useMemo(() => locations.filter(l => l.type === 'food_court'), [locations]);
  const gates = React.useMemo(() => locations.filter(l => l.type === 'gate'), [locations]);
  const ongoingMatches = React.useMemo(() => matches.filter(m => m.status === 'ongoing'), [matches]);

  const handleFetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const activeMatch = matches.find(m => m.status === 'ongoing') || matches[0];
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: `Analyze this match card and output comprehensive real-time insights, game tactics, and stadium atmosphere analysis: ${JSON.stringify(activeMatch)}`,
          role: 'fan'
        })
      });
      const data = await res.json();
      setMatchInsights(data.text);
    } catch (err) {
      console.error(err);
      setMatchInsights('Failed to generate real-time insights. Ensure your Gemini API is online.');
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleTranslate = async () => {
    const cleanText = sanitizeInput(translationText);
    if (!cleanText.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/gemini/translate-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, targetLanguage: targetLang })
      });
      const data = await res.json();
      setTranslatedResult(data.translatedText + '\n\nPronunciation Guide: ' + data.pronunciationGuide);
    } catch (err) {
      console.error(err);
      setTranslatedResult('Translation failed. Running in offline mode.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT COLUMN: NAVIGATION CONTROL & MULTILINGUAL */}
      <div className="space-y-6">
        {/* Dynamic Route Optimizer Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">AI-Optimized Indoor Wayfinding</h3>
              <p className="text-[11px] text-slate-400">Avoid congested queues and step blocks</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="start-seat-input" className="block text-[11px] text-slate-400 font-medium mb-1.5">Your Current Location / Seat</label>
              <input
                id="start-seat-input"
                type="text"
                value={startSeat}
                onChange={(e) => setStartSeat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g., Sector A Row 12 Seat 5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dest-select" className="block text-[11px] text-slate-400 font-medium mb-1.5">Destination</label>
                <select
                  id="dest-select"
                  value={selectedDest}
                  onChange={(e) => setSelectedDest(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <optgroup label="Restrooms">
                    {toilets.map(t => <option key={t.id} value={t.id}>{t.name} ({t.currentWaitTimeMinutes}m wait)</option>)}
                  </optgroup>
                  <optgroup label="Food Courts">
                    {foodCourts.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </optgroup>
                  <optgroup label="Gates / Exits">
                    {gates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </optgroup>
                </select>
              </div>

              <div>
                <label htmlFor="accessibility-select" className="block text-[11px] text-slate-400 font-medium mb-1.5">Accessibility Profile</label>
                <select
                  id="accessibility-select"
                  value={accessibility}
                  onChange={(e) => setAccessibility(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="none">Standard Path</option>
                  <option value="wheelchair">Wheelchair Access (Ramps, Elevators)</option>
                  <option value="low-height">Accessible Height (Low steps)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                const cleanStart = sanitizeInput(startSeat);
                onTriggerRoute(cleanStart, selectedDest, accessibility);
              }}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Calculate Smart Path with Gemini
            </button>
          </div>
        </div>

        {/* Translation Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Multi-Language Fan Assistant</h3>
              <p className="text-[11px] text-slate-400">Instantly translate announcers and signs</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="translate-input" className="block text-[11px] text-slate-400 font-medium mb-1.5">Stadium Announcement / Help Phrase</label>
              <textarea
                id="translate-input"
                rows={2}
                value={translationText}
                onChange={(e) => setTranslationText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <label htmlFor="lang-select" className="sr-only">Target Language</label>
              <select
                id="lang-select"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="Spanish">Spanish (Español)</option>
                <option value="Japanese">Japanese (日本語)</option>
                <option value="Arabic">Arabic (العربية)</option>
                <option value="German">German (Deutsch)</option>
                <option value="French">French (Français)</option>
              </select>

              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="px-6 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {isTranslating ? 'Translating...' : 'Translate'}
              </button>
            </div>

            {translatedResult && (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-bold text-[10px] uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Translated Guide
                  </p>
                  <button
                    onClick={() => {
                      try {
                        const speechText = translatedResult.split('Pronunciation Guide:')[0].replace(/\[.*?\]:/g, '').trim();
                        const utterance = new SpeechSynthesisUtterance(speechText);
                        const langCodes: Record<string, string> = {
                          'Spanish': 'es-ES',
                          'Japanese': 'ja-JP',
                          'Arabic': 'ar-SA',
                          'German': 'de-DE',
                          'French': 'fr-FR'
                        };
                        utterance.lang = langCodes[targetLang] || 'en-US';
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utterance);
                      } catch (err) {
                        console.error('Speech synthesis failed', err);
                      }
                    }}
                    className="px-2 py-1 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-semibold cursor-pointer flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    title="Speak translated text aloud"
                    aria-label="Listen to translated text announcement"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
                    </svg>
                    Listen
                  </button>
                </div>
                <p className="text-slate-200 whitespace-pre-wrap">{translatedResult}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE MATCH INSIGHTS & UTILITY METRICS */}
      <div className="space-y-6">
        {/* Dynamic Match Insights Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg animate-pulse">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Live Match insights</h3>
                <p className="text-[11px] text-slate-400">AI-powered analytics and game-day facts</p>
              </div>
            </div>

            <button
              onClick={handleFetchInsights}
              disabled={loadingInsights}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer disabled:bg-slate-800 disabled:text-slate-500"
            >
              <Sparkles className="w-3 h-3" />
              {loadingInsights ? 'Analyzing...' : 'Generate insights'}
            </button>
          </div>

          {/* Active Schedule Overview */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800/60 p-4 mb-4">
            {ongoingMatches.map(m => (
              <div key={m.id}>
                <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold tracking-wider uppercase mb-1">
                  <span>Active Match</span>
                  <span>{m.time}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-100">{m.eventName}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{m.details}</p>
              </div>
            ))}
          </div>

          {matchInsights ? (
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 text-xs max-h-[190px] overflow-y-auto space-y-2">
              <p className="font-bold text-[9px] uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gemini Tactical Board
              </p>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {matchInsights.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="text-emerald-400 font-semibold">{part}</strong> : part)}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-dashed border-slate-800/60 rounded-xl p-8 text-center text-xs text-slate-500">
              Click "Generate Insights" to let Gemini formulate a technical tactical breakdown, momentum charts, and key crowd updates.
            </div>
          )}
        </div>

        {/* Selected Location Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Live Spot Inspector</h3>
              <p className="text-[11px] text-slate-400">Click pins on the map to inspect wait times</p>
            </div>
          </div>

          {selectedLocation ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-100">{selectedLocation.name}</h4>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase ${
                  selectedLocation.density === 'low' 
                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/20' 
                    : selectedLocation.density === 'medium'
                    ? 'bg-amber-950/50 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-950/60 text-rose-400 border border-rose-500/30 animate-pulse'
                }`}>
                  {selectedLocation.density} density
                </span>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">{selectedLocation.description}</p>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Queue Wait Time</span>
                  <span className="font-bold text-slate-200">{selectedLocation.currentWaitTimeMinutes ?? 0} mins</span>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Accessibility Rating</span>
                  <span className="font-bold text-indigo-400 text-[10px] line-clamp-1">{selectedLocation.accessibilityNote ? 'ADA High Compliance' : 'Standard'}</span>
                </div>
              </div>

              {selectedLocation.specials && (
                <div>
                  <h5 className="text-[11px] font-semibold text-slate-400 mb-1">Specials Today:</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedLocation.specials.map((spec, index) => (
                      <span key={index} className="text-[10px] bg-slate-800 text-slate-200 border border-slate-700/60 px-2.5 py-1 rounded-lg font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-dashed border-slate-800/60 rounded-xl p-8 text-center text-xs text-slate-500">
              Select any spot on the left Map Blueprint to dynamically check active queues, ratings, and accessibility details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
