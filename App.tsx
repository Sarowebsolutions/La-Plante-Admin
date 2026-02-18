import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import MetricsChart from './components/MetricsChart';
import { UserRole, User, AppState, Metric, Exercise, WorkoutProgram } from './types';
import { ADMIN_USER, DEMO_CLIENTS, INITIAL_TIPS, INITIAL_METRICS } from './constants';
import { generateWorkoutAdvice } from './services/geminiService';

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

  // Initialize workout for the demo client if not exists
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

  const toggleExercise = (clientId: string, workoutId: string, exerciseId: string) => {
    setState(prev => {
      const clientWorkouts = [...(prev.workouts[clientId] || [])];
      const workoutIdx = clientWorkouts.findIndex(w => w.id === workoutId);
      if (workoutIdx === -1) return prev;
      
      const updatedExercises = clientWorkouts[workoutIdx].exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
      );
      
      const isNowCompleted = updatedExercises.every(ex => ex.completed);
      clientWorkouts[workoutIdx] = { 
        ...clientWorkouts[workoutIdx], 
        exercises: updatedExercises,
        isCompleted: isNowCompleted
      };

      // Explicitly cast to User to ensure todayStatus matches the union type literal
      const updatedClients = prev.clients.map(c => 
        c.id === clientId ? ({ ...c, todayStatus: (isNowCompleted ? 'Completed' : 'In Progress') as 'Completed' | 'In Progress' | 'Not Started' } as User) : c
      );
      
      return {
        ...prev,
        clients: updatedClients,
        workouts: { ...prev.workouts, [clientId]: clientWorkouts }
      };
    });
  };

  const logSetData = (clientId: string, workoutId: string, exerciseId: string, weight: number, reps: number) => {
    setState(prev => {
      const clientWorkouts = [...(prev.workouts[clientId] || [])];
      const workoutIdx = clientWorkouts.findIndex(w => w.id === workoutId);
      if (workoutIdx === -1) return prev;

      const updatedExercises = clientWorkouts[workoutIdx].exercises.map(ex => {
        if (ex.id === exerciseId) {
          const loggedSets = [...(ex.loggedSets || []), { weight, reps }];
          return { ...ex, loggedSets, completed: loggedSets.length >= ex.sets };
        }
        return ex;
      });

      clientWorkouts[workoutIdx] = { ...clientWorkouts[workoutIdx], exercises: updatedExercises };
      return { ...prev, workouts: { ...prev.workouts, [clientId]: clientWorkouts } };
    });
  };

  const addWeightMetric = () => {
    if (!currentUser || !newWeight) return;
    const weightVal = parseFloat(newWeight);
    if (isNaN(weightVal)) return;

    const newMetric: Metric = {
      date: new Date().toISOString().split('T')[0],
      weight: weightVal,
      strengthScore: 100,
      energy: 8
    };

    setState(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [currentUser.id]: [...(prev.metrics[currentUser.id] || []), newMetric]
      }
    }));
    setNewWeight('');
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
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBusinessConfig({ logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !currentUser) return;
    const msg = {
      id: Math.random().toString(),
      senderId: currentUser.id,
      receiverId: currentUser.role === UserRole.ADMIN ? selectedClientId || 'c-1' : 'admin-1',
      text: chatInput,
      timestamp: Date.now()
    };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, msg]
    }));
    setChatInput('');
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
          <div className="space-y-8 transition-all duration-500 animate-fade-in">
            {selectedClientId ? (
              <div className="space-y-6">
                <button onClick={() => setSelectedClientId(null)} className="flex items-center gap-2 text-slate-400 hover:text-brand-600 font-black text-xs uppercase transition-all tracking-widest">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M15 19l-7-7 7-7" /></svg>
                  Back to Clients
                </button>
                <div className="flex flex-col xl:flex-row gap-6 items-start">
                  <div className="flex-1 space-y-6 w-full">
                    <header className="flex items-center gap-4">
                      <img src={state.clients.find(c => c.id === selectedClientId)?.avatar} className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-50 shadow-md" />
                      <div>
                        <h2 className="text-3xl font-brand font-black text-slate-900 leading-tight">{state.clients.find(c => c.id === selectedClientId)?.name}</h2>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                          <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Athlete Details</p>
                        </div>
                      </div>
                    </header>
                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
                      <h3 className="text-xl font-brand font-black mb-6 text-slate-800 tracking-tight">Performance Biometrics</h3>
                      <MetricsChart data={state.metrics[selectedClientId] || []} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-brand font-black text-slate-900 tracking-tight">Active Clients</h2>
                  <p className="text-slate-500 mt-2 font-black text-xs uppercase tracking-widest">Client Management Protocol</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.clients.map(client => (
                    <div 
                      key={client.id} 
                      onClick={() => setSelectedClientId(client.id)}
                      className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-brand-500 opacity-0 group-hover:opacity-100 transition-all" />
                      <div className="relative mb-4 flex items-center gap-4">
                        <img src={client.avatar} className="w-14 h-14 rounded-lg object-cover ring-2 ring-slate-50 shadow-sm" />
                        <div>
                          <h4 className="text-lg font-black text-slate-900 group-hover:text-brand-600 transition-colors">{client.name}</h4>
                          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{client.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'settings':
        return (
          <div className="animate-fade-in transition-all space-y-8 max-w-lg">
            <div>
              <h2 className="text-3xl font-brand font-black text-slate-900 tracking-tight">Branding Control</h2>
              <p className="text-slate-500 mt-2 font-black text-xs uppercase tracking-widest">Business Identity Management</p>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Business Name</label>
                <input 
                  type="text" 
                  value={state.config.name}
                  onChange={(e) => updateBusinessConfig({ name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-brand-500/10 outline-none"
                />
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
          <div className="space-y-8 animate-fade-in transition-all">
            <header>
              <h2 className="text-4xl font-brand font-black text-slate-900 tracking-tight leading-none">Athlete Dashboard</h2>
              <p className="text-slate-400 font-black text-xs mt-3 italic uppercase tracking-widest">Protocol Start • {currentUser?.name.split(' ')[0]}</p>
            </header>

            <div className="grid gap-6">
              <div className="bg-brand-900 text-white p-6 rounded-[1.5rem] shadow-lg shadow-brand-900/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-brand-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px]" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-brand-400/20 rounded-lg flex items-center justify-center backdrop-blur-xl border border-white/10">
                      <span className="text-brand-300 text-xs">✨</span>
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-brand-300">Coaching Insight</h4>
                  </div>
                  <p className="text-xl sm:text-2xl font-black leading-tight italic pr-4">"{aiInsight || "Consistency is your primary protocol for growth."}"</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-6 hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab('workout')}>
                <div className="w-16 h-16 bg-brand-50 rounded-xl flex items-center justify-center text-4xl shadow-inner border border-brand-100 transition-transform group-hover:scale-110">🔥</div>
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-xs font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-full uppercase tracking-[0.1em] mb-2 inline-block">Daily Protocol</span>
                  <h4 className="text-2xl font-black text-slate-900 leading-none">Today's Training</h4>
                </div>
                <button className="bg-brand-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-md hover:bg-brand-700 whitespace-nowrap">Open Session</button>
              </div>
            </div>

            <section className="pb-4">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-2xl font-brand font-black text-slate-900 tracking-tight">Performance History</h3>
                </div>
                <button onClick={() => setActiveTab('progress')} className="text-brand-700 font-black text-xs uppercase tracking-widest hover:underline px-2 py-1">View Full Log</button>
              </div>
              <MetricsChart data={state.metrics[currentUser?.id || ''] || []} />
            </section>
          </div>
        );
      default: return null;
    }
  };

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative transition-all duration-1000">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-600 animate-pulse" />
        <div className="max-w-xs w-full text-center relative z-10 animate-fade-in">
          <div className="w-16 h-16 bg-brand-600 rounded-xl mb-8 mx-auto flex items-center justify-center text-3xl font-black shadow-2xl transition-all hover:scale-110">
            {state.config.logoUrl ? (
              <img src={state.config.logoUrl} className="w-full h-full object-cover rounded-xl" />
            ) : 'L'}
          </div>
          <h1 className="text-3xl font-brand font-black mb-2 tracking-tight">{state.config.name}</h1>
          <p className="text-slate-500 mb-10 text-xs font-black uppercase tracking-[0.2em]">Elite Performance Protocol</p>
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => handleLogin(UserRole.ADMIN)}
                  className="w-full bg-brand-600 text-white py-4 rounded-xl font-black text-sm hover:bg-brand-500 transition-all active:scale-95 shadow-xl shadow-brand-500/10 uppercase tracking-widest"
                >
                  Coach Portal
                </button>
                <button 
                  onClick={() => handleLogin(UserRole.CLIENT)}
                  className="w-full bg-slate-900 text-slate-400 py-4 rounded-xl font-black text-sm hover:bg-slate-800 transition-all border border-slate-800 active:scale-95 uppercase tracking-widest"
                >
                  Client Access
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={currentUser} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      config={state.config}
    >
      {currentUser.role === UserRole.ADMIN ? renderAdminView() : renderClientView()}
    </Layout>
  );
};

export default App;