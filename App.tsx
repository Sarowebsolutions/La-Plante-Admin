import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.tsx';
import MetricsChart from './components/MetricsChart.tsx';
import { UserRole, User, AppState, Metric } from './types.ts';
import { ADMIN_USER, DEMO_CLIENTS, INITIAL_TIPS, INITIAL_METRICS } from './constants.ts';
import { generateWorkoutAdvice } from './services/geminiService.ts';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [state, setState] = useState<AppState>({
    currentUser: null,
    clients: DEMO_CLIENTS,
    workouts: {},
    nutrition: {},
    metrics: INITIAL_METRICS,
    messages: [],
    tips: INITIAL_TIPS,
    config: {
      name: 'La Plante Fitness',
      logoUrl: undefined
    }
  });
  
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newWeight, setNewWeight] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  useEffect(() => {
    if (!state.workouts['c-1']) {
      setState(prev => ({
        ...prev,
        workouts: {
          ...prev.workouts,
          'c-1': [
            {
              id: 'w-1',
              title: 'Lower Body Hypertrophy',
              description: 'Focus on quad depth and control.',
              date: new Date().toISOString().split('T')[0],
              exercises: [
                { id: 'e-1', name: 'Barbell Back Squat', sets: 4, reps: '8-10', notes: 'Keep upright.', loggedSets: [] },
                { id: 'e-2', name: 'Romanian Deadlift', sets: 3, reps: '12', notes: 'Feel the stretch.', loggedSets: [] },
                { id: 'e-3', name: 'Leg Extensions', sets: 3, reps: '15', notes: 'Tempo 3-0-1.', loggedSets: [] },
              ]
            }
          ]
        }
      }));
    }
  }, [state.workouts]);

  const handleLogin = (role: UserRole) => {
    setLoading(true);
    setTimeout(() => {
      const user = role === UserRole.ADMIN ? ADMIN_USER : DEMO_CLIENTS[0];
      setCurrentUser(user);
      setIsLoggedIn(true);
      setActiveTab(role === UserRole.ADMIN ? 'clients' : 'home');
      setLoading(false);
    }, 600);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedClientId(null);
  };

  const updateBusinessConfig = (updates: Partial<typeof state.config>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File is too large. Please keep it under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBusinessConfig({ logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    updateBusinessConfig({ logoUrl: undefined });
  };

  useEffect(() => {
    if (isLoggedIn && currentUser?.role === UserRole.CLIENT) {
      const clientMetrics = state.metrics[currentUser.id] || [];
      if (clientMetrics.length > 0) {
        generateWorkoutAdvice(clientMetrics).then(setAiInsight);
      }
    }
  }, [isLoggedIn, currentUser, state.metrics]);

  const renderAdminView = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'clients':
        return (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-4xl font-brand font-black text-slate-900 tracking-tight">Active Clients</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.clients.map(client => (
                <div key={client.id} onClick={() => setSelectedClientId(client.id)} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <img src={client.avatar} className="w-14 h-14 rounded-lg object-cover ring-2 ring-slate-50" />
                    <div>
                      <h4 className="text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">{client.name}</h4>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{client.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="animate-fade-in space-y-8 max-w-lg">
            <div>
              <h2 className="text-4xl font-brand font-black text-slate-900 tracking-tight">Branding Control</h2>
              <p className="text-slate-500 mt-2 font-black text-xs uppercase tracking-widest">Business Identity Management</p>
            </div>
            
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Business Name</label>
                <input 
                  type="text" 
                  value={state.config.name}
                  onChange={(e) => updateBusinessConfig({ name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-brand-500/10 outline-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Brand Logo</label>
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="relative group">
                    {state.config.logoUrl ? (
                      <img src={state.config.logoUrl} className="w-24 h-24 rounded-2xl object-cover shadow-xl border-4 border-white" />
                    ) : (
                      <div className="w-24 h-24 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-brand font-black text-3xl shadow-xl border-4 border-white">
                        {state.config.name.charAt(0)}
                      </div>
                    )}
                    {state.config.logoUrl && (
                      <button 
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h5 className="text-sm font-black text-slate-900">Custom Brand Identity</h5>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                      Upload your logo to update headers, login screens, and reports globally.
                    </p>
                    <div className="pt-2">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} id="logo-upload" className="hidden" />
                      <label htmlFor="logo-upload" className="inline-block bg-brand-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-brand-700 transition-all shadow-md">
                        {state.config.logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderClientView = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8 animate-fade-in">
            <header>
              <h2 className="text-5xl font-brand font-black text-slate-900 tracking-tight leading-none">Athlete Dashboard</h2>
              <p className="text-slate-400 font-black text-sm mt-3 italic uppercase tracking-widest">Protocol Start • {currentUser?.name.split(' ')[0]}</p>
            </header>
            <div className="bg-brand-900 text-white p-8 rounded-[1.5rem] shadow-lg relative overflow-hidden">
               <h4 className="text-xs font-black uppercase tracking-[0.3em] text-brand-300 mb-4">Coaching Insight</h4>
               <p className="text-2xl sm:text-3xl font-black leading-tight italic">"{aiInsight || "Consistency is your primary protocol for growth."}"</p>
            </div>
            <MetricsChart data={state.metrics[currentUser?.id || ''] || []} />
          </div>
        );
      default: return null;
    }
  };

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-600 animate-pulse" />
        <div className="max-w-xs w-full text-center animate-fade-in">
          <div className="mb-8 mx-auto flex items-center justify-center">
            {state.config.logoUrl ? (
              <img src={state.config.logoUrl} className="w-20 h-20 object-cover rounded-2xl shadow-2xl border-4 border-slate-900" />
            ) : (
              <div className="w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center text-4xl font-black shadow-2xl">L</div>
            )}
          </div>
          <h1 className="text-4xl font-brand font-black mb-2 tracking-tight">{state.config.name}</h1>
          <p className="text-slate-500 mb-10 text-xs font-black uppercase tracking-[0.2em]">Elite Performance Protocol</p>
          <div className="space-y-4">
            <button onClick={() => handleLogin(UserRole.ADMIN)} className="w-full bg-brand-600 text-white py-4 rounded-xl font-black text-sm hover:bg-brand-500 transition-all uppercase tracking-widest">Coach Portal</button>
            <button onClick={() => handleLogin(UserRole.CLIENT)} className="w-full bg-slate-900 text-slate-400 py-4 rounded-xl font-black text-sm hover:bg-slate-800 transition-all border border-slate-800 uppercase tracking-widest">Client Access</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} config={state.config}>
      {currentUser.role === UserRole.ADMIN ? renderAdminView() : renderClientView()}
    </Layout>
  );
};

export default App;