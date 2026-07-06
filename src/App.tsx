import React, { useState } from 'react';
import { UserRole, StadiumLocation, MatchSchedule, IncidentReport, VolunteerTask, StadiumNotification } from './types';
import { INITIAL_LOCATIONS, INITIAL_MATCHES, INITIAL_INCIDENTS, INITIAL_TASKS, INITIAL_NOTIFICATIONS } from './data';
import Header from './components/Header';
import InteractiveMap from './components/InteractiveMap';
import GeminiChat from './components/GeminiChat';
import FanDashboard from './components/FanDashboard';
import OrganizerDashboard from './components/OrganizerDashboard';
import { VolunteerDashboard, SecurityDashboard, OperationsDashboard, MedicalDashboard } from './components/SpecializedDashboards';
import { Sparkles, AlertTriangle, HelpCircle, Activity } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('fan');
  const [locations, setLocations] = useState<StadiumLocation[]>(INITIAL_LOCATIONS);
  const [matches, setMatches] = useState<MatchSchedule[]>(INITIAL_MATCHES);
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENTS);
  const [tasks, setTasks] = useState<VolunteerTask[]>(INITIAL_TASKS);
  const [notifications, setNotifications] = useState<StadiumNotification[]>(INITIAL_NOTIFICATIONS);

  // Pathfinding state
  const [selectedLocation, setSelectedLocation] = useState<StadiumLocation | null>(null);
  const [optimizedRoutePath, setOptimizedRoutePath] = useState<any | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Route path calculation
  const handleTriggerRoute = async (startSeat: string, destId: string, accessibility: string) => {
    const destLoc = locations.find(l => l.id === destId);
    if (!destLoc) return;

    setIsRouting(true);
    try {
      const res = await fetch('/api/gemini/optimize-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startSeat,
          destination: destLoc.name,
          accessibilityType: accessibility,
          role: currentRole
        })
      });
      const data = await res.json();
      setOptimizedRoutePath(data);
      setSelectedLocation(destLoc);
    } catch (err) {
      console.error('Routing error:', err);
      // Fallback
      setOptimizedRoutePath({
        pathSummary: `Direct path calculated to ${destLoc.name}.`,
        instructions: [`Walk along the current Stand deck to Level 1 concourse.`],
        estimatedMinutes: 5
      });
      setSelectedLocation(destLoc);
    } finally {
      setIsRouting(false);
    }
  };

  // Add tasks
  const handleAddTask = (newTask: Omit<VolunteerTask, 'id' | 'status'>) => {
    const taskCard: VolunteerTask = {
      ...newTask,
      id: `task-${Date.now()}`,
      status: 'pending'
    };
    setTasks(prev => [taskCard, ...prev]);

    // Send stadium notification
    const alert: StadiumNotification = {
      id: `notif-${Date.now()}`,
      type: 'operations',
      text: `New Task Assigned: "${taskCard.title}" deployed to roster.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAiGenerated: false
    };
    setNotifications(prev => [alert, ...prev]);
  };

  // Add incidents
  const handleAddIncident = (newInc: Omit<IncidentReport, 'id' | 'reportedAt'>) => {
    const incCard: IncidentReport = {
      ...newInc,
      id: `incident-${Date.now()}`,
      reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setIncidents(prev => [incCard, ...prev]);
  };

  // Resolve tasks
  const handleResolveTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' as const } : t));
  };

  // Tune gates wait time
  const handleTuneGates = (gateId: string, waitTime: number) => {
    setLocations(prev => prev.map(loc => loc.id === gateId ? { ...loc, currentWaitTimeMinutes: waitTime } : loc));
  };

  // Dismiss notification
  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Mass Emergency Evacuation Trigger
  const handleTriggerEvacuation = () => {
    const evacAlert: StadiumNotification = {
      id: `evac-${Date.now()}`,
      type: 'security',
      text: 'CRITICAL SECURITY BREACH ALERT: Please evacuate Sector North Stand through Gate 3 immediately. Walk, do not run.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAiGenerated: true
    };
    setNotifications(prev => [evacAlert, ...prev]);

    // Highlight all exit pins in emergency status
    setLocations(prev => prev.map(l => l.type === 'exit' ? { ...l, density: 'high' } : l));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        onSelectRole={(role) => {
          setCurrentRole(role);
          setOptimizedRoutePath(null); // Clear routing overlays when changing context
        }}
        notifications={notifications}
        onDismissNotification={handleDismissNotification}
      />

      {/* Main Grid Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Banner Alert if Running in Simulation Mode */}
        {process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY' && (
          <div className="bg-indigo-950/60 border border-indigo-800/80 rounded-2xl p-4 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <Sparkles className="text-indigo-400 w-5 h-5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Demo / Simulation Mode Active</h4>
                <p className="text-[11px] text-indigo-300">To enable real live Google Gemini inferences, replace the placeholder in your Settings with a valid Gemini API Key.</p>
              </div>
            </div>
          </div>
        )}

        {/* Top Layout Grid: Stadium blueprint Map & Gemini chat Co-pilot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SVG Map Blueprint */}
          <div className="lg:col-span-8 flex flex-col">
            <InteractiveMap
              locations={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
              optimizedRoutePath={optimizedRoutePath}
            />
          </div>

          {/* Gemini AI Co-pilot Chat */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <GeminiChat role={currentRole} />
          </div>

        </div>

        {/* Role Specific Sub-Dashboards Dashboard Block */}
        <div className="bg-slate-900/40 border border-slate-850/80 rounded-2xl p-6">
          <div className="border-b border-slate-800 pb-4 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                {currentRole.toUpperCase()} DASHBOARD
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Custom operations and parameters for this experience profile</p>
            </div>
            
            <span className="text-[10px] bg-slate-950 text-indigo-400 border border-indigo-500/10 px-3 py-1 rounded-full font-bold uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" /> Live Sync
            </span>
          </div>

          {/* Conditional rendering based on role */}
          {currentRole === 'fan' && (
            <FanDashboard
              locations={locations}
              matches={matches}
              onTriggerRoute={handleTriggerRoute}
              selectedLocation={selectedLocation}
            />
          )}

          {currentRole === 'organizer' && (
            <OrganizerDashboard
              locations={locations}
              incidents={incidents}
              tasks={tasks}
              onAddIncident={handleAddIncident}
              onAddTask={handleAddTask}
            />
          )}

          {currentRole === 'volunteer' && (
            <VolunteerDashboard
              tasks={tasks}
              onResolveTask={handleResolveTask}
              incidents={incidents}
            />
          )}

          {currentRole === 'security' && (
            <SecurityDashboard
              incidents={incidents}
              onTriggerEvacuation={handleTriggerEvacuation}
            />
          )}

          {currentRole === 'operations' && (
            <OperationsDashboard
              locations={locations}
              onTuneGates={handleTuneGates}
            />
          )}

          {currentRole === 'medical' && (
            <MedicalDashboard />
          )}

        </div>

      </main>

      {/* Modern, Minimalistic Stadium Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto">
        <span>© 2026 Titan Stadium Operations Platform. All rights reserved.</span>
        <div className="flex items-center gap-1 text-indigo-400/80 mt-2 sm:mt-0 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Google Gemini 3.5 Flash
        </div>
      </footer>
    </div>
  );
}
