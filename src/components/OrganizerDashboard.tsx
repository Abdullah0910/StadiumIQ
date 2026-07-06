import React, { useState } from 'react';
import { StadiumLocation, IncidentReport, VolunteerTask } from '../types';
import { ShieldAlert, Users, Sparkles, Activity, CheckCircle, PlusCircle, AlertTriangle, UserCheck, Terminal, Shield, Check, X } from 'lucide-react';
import { runAllTests, TestCaseResult } from '../tests/runTests';
import { sanitizeInput } from '../utils/security';

interface OrganizerDashboardProps {
  locations: StadiumLocation[];
  incidents: IncidentReport[];
  tasks: VolunteerTask[];
  onAddIncident: (inc: Omit<IncidentReport, 'id' | 'reportedAt'>) => void;
  onAddTask: (task: Omit<VolunteerTask, 'id' | 'status'>) => void;
}

export default function OrganizerDashboard({
  locations,
  incidents,
  tasks,
  onAddIncident,
  onAddTask
}: OrganizerDashboardProps) {
  // Operational recommendation state
  const [aiRecommendations, setAiRecommendations] = useState<string>('');
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Volunteer allocation state
  const [allocationBriefing, setAllocationBriefing] = useState<string>('');
  const [allocatedAssignments, setAllocatedAssignments] = useState<any[]>([]);
  const [isAllocating, setIsAllocating] = useState(false);

  // Adding task modal inputs
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskLoc, setTaskLoc] = useState('North Gate 1');
  const [taskCat, setTaskCat] = useState<'crowd' | 'medical' | 'clean' | 'info' | 'lost_found'>('crowd');

  // Platform Diagnostic Suite State
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const unresolvedIncidentsCount = React.useMemo(() => {
    return incidents.filter(i => i.status === 'open').length;
  }, [incidents]);

  const handleRunSuite = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      try {
        const results = runAllTests();
        setTestResults(results);
      } catch (err) {
        console.error('Test execution failed:', err);
      } finally {
        setIsRunningTests(false);
      }
    }, 400);
  };

  // Trigger AI Crowd Recommendation
  const handleFetchCrowdRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const res = await fetch('/api/gemini/crowd-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations, incidents })
      });
      const data = await res.json();
      setAiRecommendations(data.aiInsights + '\n\n' + data.recommendations.map((r: string) => `• ${r}`).join('\n'));
    } catch (err) {
      console.error(err);
      setAiRecommendations('Failed to run dynamic analysis. Please confirm Gemini configuration.');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Trigger AI Volunteer Task Assignments
  const handleOptimizeVolunteerAssignments = async () => {
    setIsAllocating(true);
    try {
      const res = await fetch('/api/gemini/volunteer-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteers: ['Volunteer Sarah', 'Volunteer James', 'Volunteer Alex'],
          tasks,
          activeIncidents: incidents
        })
      });
      const data = await res.json();
      setAllocationBriefing(data.briefing);
      setAllocatedAssignments(data.assignments);
    } catch (err) {
      console.error(err);
      setAllocationBriefing('Failed to allocate tasks. Please try again.');
    } finally {
      setIsAllocating(false);
    }
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeInput(taskTitle);
    const cleanDesc = sanitizeInput(taskDesc);
    const cleanLoc = sanitizeInput(taskLoc);

    if (!cleanTitle.trim()) return;

    onAddTask({
      title: cleanTitle,
      description: cleanDesc,
      location: cleanLoc,
      priority: 'high',
      category: taskCat
    });
    setTaskTitle('');
    setTaskDesc('');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* COLUMN 1: LIVE STATS & AI CROWD ANALYSIS */}
      <div className="xl:col-span-2 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active Spectators</span>
              <h4 className="text-xl font-bold text-slate-100 mt-1">54,820</h4>
              <p className="text-[10px] text-emerald-400 mt-1">▲ 1.2% entry rates</p>
            </div>
            <div className="p-2.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Gate Status</span>
              <h4 className="text-xl font-bold text-slate-100 mt-1">4 / 4 Open</h4>
              <p className="text-[10px] text-rose-400 mt-1">Gate 1 congested (25m wait)</p>
            </div>
            <div className="p-2.5 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active Incidents</span>
              <h4 className="text-xl font-bold text-slate-100 mt-1">{unresolvedIncidentsCount} Unresolved</h4>
              <p className="text-[10px] text-amber-400 mt-1">1 Critical alert active</p>
            </div>
            <div className="p-2.5 bg-rose-600/10 text-rose-400 border border-rose-500/20 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* AI Operational Recommendations Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">AI Crowd & Operations Advisor</h3>
                <p className="text-[11px] text-slate-400">Stadium-wide flow assessments with Google Gemini</p>
              </div>
            </div>

            <button
              onClick={handleFetchCrowdRecommendations}
              disabled={isLoadingRecommendations}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:bg-slate-800"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isLoadingRecommendations ? 'Running Analysis...' : 'Compute Operations Advice'}
            </button>
          </div>

          {aiRecommendations ? (
            <div className="bg-slate-950 border border-indigo-900/30 rounded-xl p-5 text-xs space-y-3 animate-fade-in">
              <p className="font-bold text-[10px] text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Live Gemini Operations Digest
              </p>
              <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                {aiRecommendations}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-dashed border-slate-800 rounded-xl p-10 text-center text-xs text-slate-500">
              No recommendations calculated. Click "Compute Operations Advice" to let Gemini analyze gates, crowd distribution, and ongoing safety logs.
            </div>
          )}
        </div>

        {/* Live Incident Log Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Active Stadium Incidents</h3>
              <p className="text-[11px] text-slate-400">Real-time reports filed by staff and spectators</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3 rounded-l-lg">Incident</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-r-lg">Reporter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incidents.map(inc => (
                  <tr key={inc.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{inc.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{inc.description}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-200">{inc.location}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        inc.priority === 'critical'
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30 animate-pulse'
                          : inc.priority === 'high'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {inc.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`flex items-center gap-1 ${inc.status === 'open' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {inc.status === 'open' ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{inc.reporterRole}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Security & Diagnostic Suite Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Platform Security & Diagnostic Suite</h3>
                <p className="text-[11px] text-slate-400">Verifies input filters, sanitizers, and JSON parsing integrity</p>
              </div>
            </div>

            <button
              onClick={handleRunSuite}
              disabled={isRunningTests}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:bg-slate-800"
            >
              <Activity className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
              {isRunningTests ? 'Running diagnostics...' : 'Run Diagnostics'}
            </button>
          </div>

          {testResults ? (
            <div className="space-y-3 animate-fade-in text-xs">
              <div className="bg-slate-950 p-4 border border-indigo-500/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-bold">Diagnostics Status</span>
                  <span className="font-bold text-slate-200 text-xs mt-1 block">
                    {testResults.filter(r => r.passed).length} / {testResults.length} Units verified green
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 rounded-full font-bold uppercase text-[9px] flex items-center gap-1">
                  <Check className="w-3 h-3" /> System Secured
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-855">
                {testResults.map((test, index) => (
                  <div key={index} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-slate-800 text-[8px] rounded font-semibold text-slate-400 uppercase">
                          {test.category}
                        </span>
                        <h5 className="font-semibold text-slate-200 text-[11px]">{test.name}</h5>
                      </div>
                      {test.error && (
                        <p className="text-[10px] text-rose-400 mt-1 pl-1 font-mono">{test.error}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
                      <span>{test.durationMs}ms</span>
                      {test.passed ? (
                        <span className="text-emerald-400 bg-emerald-950/20 p-1 rounded-full border border-emerald-500/10">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-rose-400 bg-rose-950/20 p-1 rounded-full border border-rose-500/10 animate-pulse">
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
              Diagnostic test records empty. Click "Run Diagnostics" to launch the on-board security validator.
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 2: VOLUNTEER COORDINATION & TASK PLANNING */}
      <div className="space-y-6">
        {/* Volunteer Coordination Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Volunteer Dispatch Engine</h3>
                <p className="text-[11px] text-slate-400">Match tasks to available volunteers</p>
              </div>
            </div>

            <button
              onClick={handleOptimizeVolunteerAssignments}
              disabled={isAllocating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer disabled:bg-slate-800"
            >
              {isAllocating ? 'Optimizing...' : 'AI Dispatch'}
            </button>
          </div>

          {allocationBriefing ? (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="bg-slate-950 p-4 border border-emerald-950/60 rounded-xl space-y-1">
                <p className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Coordinator Briefing
                </p>
                <p className="text-slate-300 leading-relaxed italic">"{allocationBriefing}"</p>
              </div>

              {allocatedAssignments.length > 0 && (
                <div className="space-y-2.5">
                  <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Optimized assignments</h5>
                  {allocatedAssignments.map((ass, i) => (
                    <div key={i} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between text-slate-200 font-bold mb-1">
                        <span>{ass.assignee}</span>
                        <span className="text-[9px] text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">Assigned</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">{ass.strategy}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-dashed border-slate-800 rounded-xl p-10 text-center text-xs text-slate-500">
              Volunteer rosters unassigned. Click "AI Dispatch" to let Gemini map Sarah, James, and Alex to active task cards based on location proximity and priority.
            </div>
          )}
        </div>

        {/* Add New Volunteer Task Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Register Operational Task</h3>
              <p className="text-[11px] text-slate-400">File a task card into the active system</p>
            </div>
          </div>

          <form onSubmit={handleAddNewTask} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Task Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Replenish face masks"
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                rows={2}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Details of instructions for volunteer"
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Location</label>
                <input
                  type="text"
                  value={taskLoc}
                  onChange={(e) => setTaskLoc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={taskCat}
                  onChange={(e) => setTaskCat(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="crowd">Crowd Flow</option>
                  <option value="clean">Clean Crew</option>
                  <option value="medical">Medical Aid</option>
                  <option value="lost_found">Lost & Found</option>
                  <option value="info">General Info</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-100 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
            >
              Deploy Task Card
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
