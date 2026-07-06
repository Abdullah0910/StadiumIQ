import React from 'react';
import { UserRole, StadiumNotification } from '../types';
import { Users, Shield, UserCheck, Settings, Activity, AlertTriangle, Bell, Info } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  notifications: StadiumNotification[];
  onDismissNotification: (id: string) => void;
}

export default function Header({
  currentRole,
  onSelectRole,
  notifications,
  onDismissNotification
}: HeaderProps) {
  const rolesList: { id: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'fan', label: 'Fan Experience', icon: <Users className="w-3.5 h-3.5" />, color: 'hover:text-indigo-400 hover:border-indigo-500/50' },
    { id: 'organizer', label: 'Organizer', icon: <Settings className="w-3.5 h-3.5" />, color: 'hover:text-purple-400 hover:border-purple-500/50' },
    { id: 'volunteer', label: 'Volunteer', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'hover:text-emerald-400 hover:border-emerald-500/50' },
    { id: 'security', label: 'Security Staff', icon: <Shield className="w-3.5 h-3.5" />, color: 'hover:text-rose-400 hover:border-rose-500/50' },
    { id: 'operations', label: 'Operations & Eco', icon: <Activity className="w-3.5 h-3.5" />, color: 'hover:text-amber-400 hover:border-amber-500/50' },
    { id: 'medical', label: 'Medical Team', icon: <Activity className="w-3.5 h-3.5" />, color: 'hover:text-red-400 hover:border-red-500/50' }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-850 p-4 sticky top-0 z-50 shadow-lg backdrop-blur">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Branding & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-600/35 border border-indigo-500/30">
            TS
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-100 tracking-wide uppercase">Titan Stadium</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Tournament Co-Pilot</p>
          </div>
        </div>

        {/* Roles Selector Nav */}
        <div className="flex flex-wrap justify-center items-center gap-2" role="navigation" aria-label="Role dashboard selector">
          {rolesList.map(role => {
            const isActive = currentRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => onSelectRole(role.id)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : `bg-slate-950 text-slate-350 border-slate-800/80 ${role.color}`
                }`}
              >
                {role.icon}
                {role.label}
              </button>
            );
          })}
        </div>

        {/* Info Feed / Alerts */}
        <div className="flex items-center gap-3">
          {/* Active Notifications Badge */}
          {notifications.length > 0 && (
            <div className="relative group">
              <button className="p-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl transition-colors cursor-pointer relative">
                <Bell className="w-4 h-4 animate-swing" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"></span>
              </button>

              {/* Quick popover dropdown */}
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all z-50">
                <h4 className="text-xs font-bold text-slate-200 mb-2 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-850 pb-2">
                  <Bell className="w-3.5 h-3.5 text-rose-400" /> Live Operations Feed
                </h4>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-start gap-2 justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            n.type === 'security' ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {n.type}
                          </span>
                          {n.isAiGenerated && (
                            <span className="text-[8px] font-bold text-indigo-400 flex items-center gap-0.5">
                              <Bell className="w-2 h-2" /> Gemini AI
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-normal">{n.text}</p>
                      </div>
                      <button
                        onClick={() => onDismissNotification(n.id)}
                        aria-label={`Dismiss notification: ${n.text}`}
                        className="text-[9px] text-slate-500 hover:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 p-0.5 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Time & Attendance Info */}
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-slate-200 block">Game Day 1</span>
            <span className="text-[10px] text-slate-500 font-medium">TITAN ARENA</span>
          </div>
        </div>

      </div>
    </header>
  );
}
