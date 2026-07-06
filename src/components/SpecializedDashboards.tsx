import React, { useState } from 'react';
import { StadiumLocation, IncidentReport, VolunteerTask, StadiumNotification } from '../types';
import { Sparkles, CheckCircle, Search, HelpCircle, ShieldAlert, FileText, AlertTriangle, Play, Zap, RefreshCw, Activity, ArrowRight, Ambulance, Sun, BatteryCharging } from 'lucide-react';

// ==========================================
// 1. VOLUNTEER DASHBOARD
// ==========================================
interface VolunteerDashboardProps {
  tasks: VolunteerTask[];
  onResolveTask: (taskId: string) => void;
  incidents: IncidentReport[];
}

export function VolunteerDashboard({ tasks, onResolveTask, incidents }: VolunteerDashboardProps) {
  const [lostDescription, setLostDescription] = useState('Black leather wallet with credit cards');
  const [foundMatch, setFoundMatch] = useState<any>(null);
  const [searchingLost, setSearchingLost] = useState(false);

  // Lost & Found dynamic matching engine
  const handleLostFoundSearch = async () => {
    setSearchingLost(true);
    try {
      const mockDatabase = [
        { id: 'found-1', name: 'Tan leather card holder', locationFound: 'Sector A Seat 10' },
        { id: 'found-2', name: 'Black leather card holder with RFID chip', locationFound: 'Near Sector C Restroom' },
        { id: 'found-3', name: 'Blue canvas backpack', locationFound: 'Gate 3 Ticketing Bench' }
      ];

      const res = await fetch('/api/gemini/lost-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: lostDescription,
          database: mockDatabase,
          history: []
        })
      });
      const data = await res.json();
      setFoundMatch(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingLost(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Tasks list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle className="text-indigo-400 w-4 h-4" />
          Your Active Duty Roster
        </h3>

        <div className="space-y-3 max-h-[360px] overflow-y-auto">
          {tasks.filter(t => t.status === 'active' || t.status === 'pending').map(task => (
            <div key={task.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    task.priority === 'high' ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {task.priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Location: {task.location}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-100">{task.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{task.description}</p>
              </div>

              <button
                onClick={() => onResolveTask(task.id)}
                className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer"
              >
                Resolve
              </button>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-xs">
              No tasks active. You are fully cleared!
            </div>
          )}
        </div>
      </div>

      {/* AI Lost & Found Matcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">AI Lost & Found Matching Engine</h3>
            <p className="text-[11px] text-slate-400">Match lost items to found records with Gemini</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Lost Item Description</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lostDescription}
                onChange={(e) => setLostDescription(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none"
              />
              <button
                onClick={handleLostFoundSearch}
                disabled={searchingLost}
                className="px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:bg-slate-800"
              >
                {searchingLost ? 'Searching...' : 'Run AI Match'}
              </button>
            </div>
          </div>

          {foundMatch && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3 animate-fade-in">
              <div>
                <p className="font-bold text-[10px] uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Empathetic Assistant Reply
                </p>
                <p className="text-slate-200 mt-1 leading-relaxed">{foundMatch.conversationReply}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] border-t border-slate-800/80 pt-3">
                <div className="bg-slate-900 p-2.5 rounded-lg">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Action Item</span>
                  <span className="font-medium text-slate-200">{foundMatch.actionStep}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Verification Task</span>
                  <span className="font-medium text-slate-200">{foundMatch.volunteerInstruction}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. SECURITY STAFF DASHBOARD
// ==========================================
interface SecurityDashboardProps {
  incidents: IncidentReport[];
  onTriggerEvacuation: () => void;
}

export function SecurityDashboard({ incidents, onTriggerEvacuation }: SecurityDashboardProps) {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('incident-2');
  const [reportResult, setReportResult] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Trigger Gemini Incident analysis report
  const handleGenerateReport = async () => {
    const activeInc = incidents.find(i => i.id === selectedIncidentId) || incidents[0];
    if (!activeInc) return;
    setGeneratingReport(true);

    try {
      const res = await fetch('/api/gemini/incident-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeInc.title,
          priority: activeInc.priority,
          location: activeInc.location,
          description: activeInc.description
        })
      });
      const data = await res.json();
      setReportResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Alert Monitor */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="text-rose-500 w-4 h-4 animate-pulse" />
          Active Security Alerts
        </h3>

        <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="text-rose-400 w-5 h-5 shrink-0 animate-bounce" />
          <div>
            <h4 className="text-xs font-bold text-rose-300">Evacuation standby warning</h4>
            <p className="text-[11px] text-rose-400/90 mt-1 leading-relaxed">
              Gate 1 ticketing scanner error caused 350-fan bottleneck corridor spill. Direct stewards to keep emergency doors clear.
            </p>
          </div>
        </div>

        {/* Emergency evacuate trigger */}
        <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-300">Manual Evacuation Drill Broadcast</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Triggers stadium-wide strobe and audible guides</p>
          </div>
          <button
            onClick={onTriggerEvacuation}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-lg shadow-rose-600/15"
          >
            <Play className="w-3.5 h-3.5" /> Evacuate
          </button>
        </div>
      </div>

      {/* AI Incident Report writer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-600/10 text-rose-400 border border-rose-500/20 rounded-lg">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">AI Incident Assessment Generator</h3>
            <p className="text-[11px] text-slate-400">Run immediate safety drills and risk assessments</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 font-sans">Select Active Incident Case</label>
            <div className="flex gap-2">
              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-rose-500"
              >
                {incidents.map(inc => (
                  <option key={inc.id} value={inc.id}>{inc.title} ({inc.priority})</option>
                ))}
              </select>
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="px-5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:bg-slate-800"
              >
                {generatingReport ? 'Analyzing...' : 'Generate report'}
              </button>
            </div>
          </div>

          {reportResult && (
            <div className="bg-slate-950 border border-rose-950/40 rounded-xl p-4 text-xs space-y-3 animate-fade-in font-mono">
              <p className="font-bold text-[9px] uppercase text-rose-400 tracking-wider font-sans flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Gemini Security Briefing
              </p>
              <p className="text-slate-300 leading-relaxed"><span className="text-rose-400 font-bold">SUMMARY:</span> {reportResult.incidentSummary}</p>
              <p className="text-slate-300 leading-relaxed"><span className="text-amber-400 font-bold">TACTICAL ACTION:</span> {reportResult.recommendedAction}</p>
              <p className="text-slate-400 italic text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-850"><span className="font-bold text-rose-400 font-sans not-italic uppercase text-[9px] block mb-1">Broadcast Strobe Text:</span> "{reportResult.securityAlertBroadcast}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. OPERATIONS & SUSTAINABILITY MANAGER
// ==========================================
interface OperationsDashboardProps {
  locations: StadiumLocation[];
  onTuneGates: (gateId: string, waitTime: number) => void;
}

export function OperationsDashboard({ locations, onTuneGates }: OperationsDashboardProps) {
  const [solarKW, setSolarKW] = useState(450);
  const [batteryPercent, setBatteryPercent] = useState(85);
  const [cleanPercent, setCleanPercent] = useState(72);
  const [sustainRecommendations, setSustainRecommendations] = useState<any>(null);
  const [loadingSustain, setLoadingSustain] = useState(false);

  // Trigger Gemini eco optimizer
  const handleFetchSustainability = async () => {
    setLoadingSustain(true);
    try {
      const res = await fetch('/api/gemini/sustainability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solarPowerKW: solarKW,
          batteryLevel: batteryPercent,
          cleanEnergyPercent: cleanPercent,
          activeFans: 54820
        })
      });
      const data = await res.json();
      setSustainRecommendations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSustain(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sustainability Metrics & Meters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Sun className="text-amber-400 w-4 h-4" />
            Stadium Smart Green Grid
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time solar panel arrays and battery levels</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Solar Output</span>
            <span className="text-lg font-bold text-slate-100">{solarKW} kW</span>
            <span className="text-[9px] text-emerald-400 block mt-1">● Peak Sunlight</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Battery Storage</span>
            <span className="text-lg font-bold text-slate-100">{batteryPercent}%</span>
            <span className="text-[9px] text-emerald-400 block mt-1">● Charging status</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Clean Ratio</span>
            <span className="text-lg font-bold text-slate-100">{cleanPercent}%</span>
            <span className="text-[9px] text-indigo-400 block mt-1">▲ Solar backed</span>
          </div>
        </div>

        {/* Adjust simulated slider variables */}
        <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs">
          <div>
            <div className="flex justify-between mb-1 text-slate-400 font-medium">
              <span>Solar Field Production</span>
              <span>{solarKW} kW</span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              value={solarKW}
              onChange={(e) => setSolarKW(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1 text-slate-400 font-medium">
              <span>Clean Energy Share</span>
              <span>{cleanPercent}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={cleanPercent}
              onChange={(e) => setCleanPercent(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        <button
          onClick={handleFetchSustainability}
          disabled={loadingSustain}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:bg-slate-800"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {loadingSustain ? 'Tuning power array...' : 'Compute Sustainability Optimizations with Gemini'}
        </button>
      </div>

      {/* AI Recommendations Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Zap className="text-indigo-400 w-4 h-4 animate-pulse" />
          Eco Operations Advisor
        </h3>

        {sustainRecommendations ? (
          <div className="bg-slate-950 border border-emerald-950/40 rounded-xl p-5 text-xs space-y-4 animate-fade-in">
            <div>
              <p className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Power Tuning Action
              </p>
              <p className="text-slate-200 mt-1 leading-relaxed">{sustainRecommendations.powerTuningAction}</p>
            </div>

            <div>
              <p className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Bio-Waste Optimizations
              </p>
              <ul className="list-disc list-inside space-y-1.5 mt-1.5 text-slate-300">
                {sustainRecommendations.wasteOptimizations.map((item: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-850">
              <span className="font-bold text-emerald-400 uppercase text-[9px] block mb-1">Fan Eco Announcement:</span>
              <p className="text-slate-300 italic">"{sustainRecommendations.publicEcoAnnouncement}"</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/20 border border-dashed border-slate-800 rounded-xl p-14 text-center text-xs text-slate-500">
            No energy plans loaded. Click "Compute Sustainability Optimizations" to let Gemini optimize solar batteries, trash compaction limits, and fan reward points.
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. MEDICAL STAFF DASHBOARD
// ==========================================
export function MedicalDashboard() {
  const [buggyDispatched, setBuggyDispatched] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Ambulance className="text-rose-500 w-4 h-4" />
          Main Medical Dispatch Control Room
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Live clinic tracking and emergency buggy allocation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold mb-1">Triage Cases</span>
          <span className="text-xl font-bold text-slate-100">1 Active</span>
          <p className="text-[10px] text-slate-400 mt-1">Minor heat stroke at Sector A</p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold mb-1">Dispatched Buggies</span>
          <span className="text-xl font-bold text-slate-100">{buggyDispatched ? '1/2 Active' : '0/2 Active'}</span>
          <p className="text-[10px] text-emerald-400 mt-1">{buggyDispatched ? 'Buggy #1 enroute' : 'All buggies on standby'}</p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold mb-1">Clinic Beds Available</span>
          <span className="text-xl font-bold text-slate-100">8 / 10 Free</span>
          <p className="text-[10px] text-indigo-400 mt-1">Level 1 clinic fully staffed</p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-rose-300">Heat stress reported: Sector A Row 15 Seat 4</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Standby buggy enroute with icepack and saline bottles</p>
        </div>

        <button
          onClick={() => setBuggyDispatched(!buggyDispatched)}
          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
            buggyDispatched 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10' 
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/10'
          }`}
        >
          {buggyDispatched ? 'Recall Buggy' : 'Dispatch Rapid Buggy'}
        </button>
      </div>
    </div>
  );
}
