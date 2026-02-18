
import React from 'react';
import { UserRole, User, BusinessConfig } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: BusinessConfig;
}

const Icons = {
  Clients: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
  ),
  Vault: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="6" rx="2"/><path d="M12 10v4"/><path d="M10 12h4"/><path d="M16 2v4"/><path d="M8 2v4"/></svg>
  ),
  Inbox: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  Home: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  Train: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15v4"/><path d="M12 17v2"/><path d="M18 15v4"/><path d="M3 13h18"/><path d="m15 5-1.6 3.1"/><path d="m9 5 1.6 3.1"/><path d="M12 22v-3"/><path d="M12 13v-3"/><path d="m20 13-1.6-3.1"/><path d="m4 13 1.6-3.1"/><path d="M12 5V2"/></svg>
  ),
  Fuel: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 2 9.5a7 7 0 0 1-7 7c-1 0-2-.3-3-.9"/><path d="M9 21s-4-1-4-4 4-1 4-4"/></svg>
  ),
  Stats: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  )
};

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activeTab, setActiveTab, config }) => {
  const isAdmin = user.role === UserRole.ADMIN;

  const adminTabs = [
    { id: 'clients', label: 'Clients', icon: Icons.Clients },
    { id: 'calendar', label: 'Schedule', icon: Icons.Calendar },
    { id: 'tips', label: 'Vault', icon: Icons.Vault },
    { id: 'messages', label: 'Contact', icon: Icons.Inbox },
    { id: 'settings', label: 'Branding', icon: Icons.Settings },
  ];

  const clientTabs = [
    { id: 'home', label: 'Home', icon: Icons.Home },
    { id: 'workout', label: 'Lift', icon: Icons.Train },
    { id: 'nutrition', label: 'Fuel', icon: Icons.Fuel },
    { id: 'progress', label: 'Stats', icon: Icons.Stats },
    { id: 'chat', label: 'Coach', icon: Icons.Inbox },
  ];

  const tabs = isAdmin ? adminTabs : clientTabs;

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFF] text-slate-800 transition-colors duration-500">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 px-5 py-3 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          {config.logoUrl ? (
            <img src={config.logoUrl} className="w-8 h-8 rounded-xl object-cover shadow-lg shadow-brand-500/10 transition-transform hover:scale-105" alt="Logo" />
          ) : (
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-brand-500/20 transition-transform hover:scale-105">
              {config.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-base font-brand font-black text-slate-900 leading-none">{config.name}</h1>
            <span className="text-[8px] text-brand-600 font-bold uppercase tracking-[0.2em] block mt-0.5">Performance</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-slate-900">{user.name}</p>
            <p className="text-[8px] text-slate-400 font-bold uppercase">{user.role}</p>
          </div>
          <button 
            onClick={onLogout}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex flex-col w-16 bg-white border-r border-slate-100 py-6 items-center gap-3 transition-all duration-300">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all relative group ${
                activeTab === tab.id 
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <tab.icon />
              <span className="text-[7px] font-bold uppercase tracking-tighter mt-1">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute -left-0 w-0.5 h-4 bg-brand-500 rounded-r-full" />
              )}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#FDFDFF] pb-20 md:pb-6 relative scroll-smooth">
          <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around items-center px-4 py-2 z-50 shadow-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-all ${
              activeTab === tab.id ? 'text-brand-600 bg-brand-50' : 'text-slate-400'
            }`}
          >
            <tab.icon />
            <span className="text-[7px] font-bold uppercase tracking-tighter mt-1">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
