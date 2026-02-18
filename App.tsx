
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

      const updatedClients = prev.clients.map(c => 
        c.id === clientId ? { ...c, todayStatus: isNowCompleted ? 'Completed' : 'In Progress' } : c
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

  const CalendarGrid = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dates = Array.from({ length: 35 }, (_, i) => i - 2); 
    return (
      <div className="bg-white rounded-[1rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-700">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
          {days.map(d => (
            <div key={d} className="py-2.5 text-center text-[7px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dates.map((d, i) => (
            <div key={i} className={`h-14 sm:h-20 border-r border-b border-slate-50 p-1.5 transition-all hover:bg-brand-50/20 ${d <= 0 || d > 31 ? 'bg-slate-50/10' : ''}`}>
              <span className={`text-[8px] font-black ${d === 15 ? 'text-brand-600' : 'text-slate-300'}`}>{d > 0 && d <= 31 ? d : ''}</span>
              {d === 15 && (
                <div className="mt-0.5 bg-brand-600 text-white text-[6px] p-0.5 rounded-sm font-black truncate">Alex T.</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAdminView = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'clients':
        return (
          <div className="space-y-6 transition-all duration-500 animate-fade-in">
            {selectedClientId ? (
              <div className="space-y-4">
                <button onClick={() => setSelectedClientId(null)} className="flex items-center gap-1 text-slate-400 hover:text-brand-600 font-black text-[7px] uppercase transition-all tracking-widest">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M15 19l-7-7 7-7" /></svg>
                  Back to clients
                </button>
                <div className="flex flex-col xl:flex-row gap-4 items-start">
                  <div className="flex-1 space-y-4 w-full">
                    <header className="flex items-center gap-3">
                      <img src={state.clients.find(c => c.id === selectedClientId)?.avatar} className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-50 shadow-md" />
                      <div>
                        <h2 className="text-xl font-brand font-black text-slate-900 leading-tight">{state.clients.find(c => c.id === selectedClientId)?.name}</h2>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-brand-500 rounded-full animate-pulse" />
                          <p className="text-slate-500 text-[7px] font-black uppercase tracking-widest">Client Details</p>
                        </div>
                      </div>
                    </header>
                    <div className="bg-white p-4 sm:p-6 rounded-[1rem] border border-slate-100 shadow-sm transition-all hover:shadow-lg">
                      <h3 className="text-sm font-brand font-black mb-4 text-slate-800 tracking-tight">Biometrics</h3>
                      <MetricsChart data={state.metrics[selectedClientId] || []} />
                    </div>
                  </div>
                  <aside className="w-full xl:w-64 space-y-3">
                    <div className="bg-brand-900 text-white p-4 rounded-[1rem] shadow-lg shadow-brand-900/10">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-300 mb-3">Live Log</h4>
                      {state.workouts[selectedClientId]?.[0] ? (
                        <div className="space-y-3">
                           <div>
                            <p className="text-base font-black leading-tight">{state.workouts[selectedClientId][0].title}</p>
                            <p className="text-[7px] text-brand-300/80 font-black uppercase mt-0.5 tracking-widest">{state.workouts[selectedClientId][0].isCompleted ? 'Finished' : 'Active'}</p>
                           </div>
                           <div className="space-y-1.5">
                             {state.workouts[selectedClientId][0].exercises.map(ex => (
                               <div key={ex.id} className="p-2 bg-white/5 rounded-lg border border-white/5">
                                 <div className="flex items-center justify-between mb-0.5">
                                    <span className={`text-[9px] font-black ${ex.completed ? 'text-brand-300' : 'text-slate-300'}`}>{ex.name}</span>
                                    <span className="text-[6px] font-black text-white/30">{ex.loggedSets?.length || 0}/{ex.sets}</span>
                                 </div>
                                 <div className="flex gap-0.5">
                                    {Array.from({length: ex.sets}).map((_, i) => (
                                      <div key={i} className={`flex-1 h-0.5 rounded-full ${i < (ex.loggedSets?.length || 0) ? 'bg-brand-400' : 'bg-white/10'}`} />
                                    ))}
                                 </div>
                               </div>
                             ))}
                           </div>
                        </div>
                      ) : (
                        <p className="text-[8px] font-black opacity-60 italic py-2 text-center">No current session.</p>
                      )}
                    </div>
                    <button onClick={() => setActiveTab('messages')} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-black text-[8px] uppercase tracking-[0.2em] hover:bg-brand-600 transition-all">Quick Contact</button>
                  </aside>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-brand font-black text-slate-900 tracking-tight">Clients</h2>
                  <p className="text-slate-500 mt-1 font-black text-[11px] uppercase tracking-widest">Management console.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.clients.map(client => (
                    <div 
                      key={client.id} 
                      onClick={() => setSelectedClientId(client.id)}
                      className="bg-white p-4 sm:p-5 rounded-[1.2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-500 opacity-0 group-hover:opacity-100 transition-all" />
                      <div className="relative mb-3 flex items-center gap-3">
                        <img src={client.avatar} className="w-12 h-12 rounded-lg object-cover ring-2 ring-slate-50 transition-all group-hover:scale-105" />
                        <div>
                          <h4 className="text-base font-black text-slate-900 group-hover:text-brand-600 transition-colors">{client.name}</h4>
                          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{client.email}</p>
                        </div>
                        <div className={`ml-auto w-3 h-3 rounded-full ${
                          client.todayStatus === 'Completed' ? 'bg-brand-500' : client.todayStatus === 'In Progress' ? 'bg-amber-400' : 'bg-slate-200'
                        }`} />
                      </div>
                      <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Consistency</span>
                          <p className="text-[10px] font-black text-slate-900">92%</p>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-600 group-hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-2 border-dashed border-slate-100 rounded-[1.2rem] p-5 flex flex-col items-center justify-center text-slate-300 hover:bg-brand-50/30 hover:border-brand-100 transition-all group cursor-pointer">
                    <div className="text-xl font-black mb-1 group-hover:scale-110 transition-transform">+</div>
                    <p className="font-black text-[7px] uppercase tracking-[0.1em]">New Client</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'calendar':
        return (
          <div className="space-y-6 animate-fade-in transition-all">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-brand font-black text-slate-900 tracking-tight leading-none">Schedule</h2>
                <p className="text-slate-500 mt-1 text-[11px] font-black uppercase tracking-widest">Daily roster sessions.</p>
              </div>
              <button className="bg-brand-600 text-white px-4 py-2 rounded-lg font-black text-[8px] uppercase tracking-[0.1em] shadow-lg shadow-brand-500/10 hover:bg-brand-700 transition-all">New Slot</button>
            </header>
            <CalendarGrid />
          </div>
        );
      case 'tips':
        return (
          <div className="space-y-6 animate-fade-in transition-all max-w-lg">
            <h2 className="text-2xl font-brand font-black text-slate-900 tracking-tight">The Vault</h2>
            <div className="space-y-4">
              {state.tips.map(tip => (
                <div key={tip.id} className="bg-white p-5 rounded-[1.2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
                  <div className="absolute top-5 right-5 text-[7px] font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{tip.category}</div>
                  <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">{tip.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-4 text-[11px] font-medium opacity-80">{tip.content}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <span className="text-[7px] text-slate-300 font-black uppercase tracking-widest">{tip.date}</span>
                    <button className="text-brand-700 font-black text-[7px] uppercase tracking-widest hover:text-brand-900 transition-all">Modify</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="animate-fade-in transition-all space-y-6">
            <h2 className="text-2xl font-brand font-black text-slate-900 tracking-tight">Directory</h2>
            <div className="grid gap-3">
              {state.clients.map(client => (
                <div key={client.id} className="bg-white p-4 rounded-[1.2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <img src={client.avatar} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                    <div>
                      <h4 className="text-base font-black text-slate-900 leading-none">{client.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-black uppercase tracking-widest">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <a href={`tel:${client.phone}`} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-brand-50 text-brand-700 px-3 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-brand-100 transition-all">
                       Call
                    </a>
                    <a href={`sms:${client.phone}`} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-brand-50 text-brand-700 px-3 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-brand-100 transition-all">
                       Text
                    </a>
                    <a href={`mailto:${client.email}`} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-brand-900 text-white px-3 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-brand-700 transition-all shadow-md">
                       Email
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="animate-fade-in transition-all space-y-6 max-w-md">
            <div>
              <h2 className="text-2xl font-brand font-black text-slate-900 tracking-tight">Branding</h2>
              <p className="text-slate-500 mt-1 font-black text-[11px] uppercase tracking-widest">Identity management.</p>
            </div>
            <div className="bg-white p-5 rounded-[1.2rem] border border-slate-100 shadow-sm space-y-5">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Business Name</label>
                <input 
                  type="text" 
                  value={state.config.name}
                  onChange={(e) => updateBusinessConfig({ name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[11px] font-black outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Logo</label>
                <div className="flex items-center gap-4">
                  {state.config.logoUrl ? (
                    <img src={state.config.logoUrl} className="w-12 h-12 rounded-xl object-cover border border-brand-50" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 font-black text-lg">
                      {state.config.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} id="logo-upload" className="hidden" />
                    <label htmlFor="logo-upload" className="inline-block bg-brand-50 text-brand-700 px-3 py-2 rounded-lg font-black text-[7px] uppercase tracking-widest cursor-pointer hover:bg-brand-100">
                      Upload
                    </label>
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
          <div className="space-y-6 animate-fade-in transition-all">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h2 className="text-3xl font-brand font-black text-slate-900 tracking-tight leading-none">Dashboard</h2>
                <p className="text-slate-400 font-black text-[11px] mt-1 italic uppercase tracking-widest">Protocol Start • {currentUser?.name.split(' ')[0]}</p>
              </div>
            </header>

            <div className="grid gap-4">
              <div className="bg-brand-900 text-white p-5 rounded-[1.2rem] shadow-lg shadow-brand-900/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[15rem] h-[15rem] bg-brand-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[40px]" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-brand-400/20 rounded-lg flex items-center justify-center backdrop-blur-xl border border-white/10">
                      <span className="text-brand-300 text-[7px]">✨</span>
                    </div>
                    <h4 className="text-[7px] font-black uppercase tracking-[0.3em] text-brand-300">Coaching Insight</h4>
                  </div>
                  <p className="text-base sm:text-lg font-black leading-tight italic pr-4">"{aiInsight || "Consistency is your primary protocol for growth."}"</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-4 hover:shadow-lg transition-all cursor-pointer" onClick={() => setActiveTab('workout')}>
                <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center text-3xl shadow-inner border border-brand-100 transition-transform group-hover:scale-110">🔥</div>
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-[8px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full uppercase tracking-[0.1em] mb-1 inline-block">Daily Protocol</span>
                  <h4 className="text-xl font-black text-slate-900 leading-none">Today's Session</h4>
                </div>
                <button className="bg-brand-900 text-white px-5 py-2.5 rounded-lg font-black text-[8px] uppercase tracking-[0.1em] shadow-md hover:bg-brand-700 whitespace-nowrap">Open Lift</button>
              </div>
            </div>

            <section className="pb-2">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-lg font-brand font-black text-slate-900 tracking-tight">Performance Metrics</h3>
                </div>
                <button onClick={() => setActiveTab('progress')} className="text-brand-700 font-black text-[8px] uppercase tracking-widest hover:underline px-2 py-1">View Full Stats</button>
              </div>
              <MetricsChart data={state.metrics[currentUser?.id || ''] || []} />
            </section>
          </div>
        );
      case 'workout':
        const currentWorkout = state.workouts[currentUser?.id || '']?.[0];
        return (
          <div className="space-y-4 animate-fade-in transition-all">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
               <div>
                <h2 className="text-2xl font-brand font-black text-slate-900 tracking-tight leading-none">{currentWorkout?.title || 'Session'}</h2>
               </div>
               <div className="bg-brand-900 text-white px-2.5 py-1 rounded-md text-[7px] font-black uppercase tracking-[0.1em] shadow-md">
                 {currentWorkout?.exercises.filter(e => e.completed).length}/{currentWorkout?.exercises.length} Finalized
               </div>
            </header>
            <div className="space-y-3">
               {currentWorkout?.exercises.map((ex) => (
                 <div 
                  key={ex.id} 
                  className={`bg-white p-4 rounded-[1.2rem] border transition-all flex flex-col gap-3 ${ex.completed ? 'border-brand-100 bg-brand-50/10 opacity-70' : 'border-slate-100 shadow-sm'}`}
                 >
                   <div className="flex items-center gap-3">
                     <div 
                        onClick={() => toggleExercise(currentUser!.id, currentWorkout.id, ex.id)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm ${ex.completed ? 'bg-brand-900 text-white' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}
                      >
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                     </div>
                     <div className="flex-1">
                       <h4 className={`text-base font-black transition-all ${ex.completed ? 'text-slate-300 line-through' : 'text-slate-900'}`}>{ex.name}</h4>
                       <div className="flex gap-2 mt-0.5">
                        <span className="text-brand-700 font-black text-[7px] uppercase tracking-widest">{ex.sets} Sets</span>
                        <span className="text-brand-700 font-black text-[7px] uppercase tracking-widest">{ex.reps} Reps</span>
                       </div>
                     </div>
                     <button onClick={() => setActiveExerciseId(activeExerciseId === ex.id ? null : ex.id)} className="text-[7px] font-black uppercase tracking-[0.1em] text-slate-400 hover:text-brand-700 transition-colors">
                        {activeExerciseId === ex.id ? 'Close' : 'Track'}
                      </button>
                   </div>
                   
                   {activeExerciseId === ex.id && (
                     <div className="pt-3 border-t border-slate-50 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <div className="space-y-1.5">
                              <h5 className="text-[6px] font-black uppercase tracking-widest text-slate-400">Log Protocol</h5>
                              <div className="flex gap-1.5">
                                <input type="number" placeholder="Lbs" className="bg-slate-50 border-none outline-none p-2 rounded-lg w-full text-[9px] font-black shadow-inner" id={`w-${ex.id}`} />
                                <input type="number" placeholder="Reps" className="bg-slate-50 border-none outline-none p-2 rounded-lg w-full text-[9px] font-black shadow-inner" id={`r-${ex.id}`} />
                                <button 
                                  onClick={() => {
                                    const wInput = document.getElementById(`w-${ex.id}`) as HTMLInputElement;
                                    const rInput = document.getElementById(`r-${ex.id}`) as HTMLInputElement;
                                    if (wInput && rInput) {
                                      logSetData(currentUser!.id, currentWorkout.id, ex.id, parseFloat(wInput.value), parseInt(rInput.value));
                                      wInput.value = '';
                                      rInput.value = '';
                                    }
                                  }}
                                  className="bg-brand-900 text-white px-3 rounded-lg font-black text-[7px] uppercase transition-all"
                                >
                                  +
                                </button>
                              </div>
                           </div>
                           <div className="space-y-1.5">
                              <h5 className="text-[6px] font-black uppercase tracking-widest text-slate-400">History Log</h5>
                              <div className="flex flex-wrap gap-1">
                                 {(ex.loggedSets || []).map((s, idx) => (
                                   <div key={idx} className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded-md text-[7px] font-black border border-brand-100">
                                     {s.weight}lbs × {s.reps}
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                   )}
                   
                   <p className="text-slate-400 text-[8px] mt-0.5 italic leading-relaxed font-black bg-slate-50/50 p-2.5 rounded-lg border border-slate-50">
                    "{ex.notes}"
                   </p>
                 </div>
               ))}
            </div>
            <button className="w-full bg-brand-900 text-white py-3 rounded-xl font-black uppercase tracking-[0.2em] shadow-md transition-all active:scale-[0.98] mt-3 hover:bg-brand-700 text-[8px]">Complete Protocol</button>
          </div>
        );
      case 'nutrition':
        return (
          <div className="space-y-6 animate-fade-in transition-all max-w-lg">
            <h2 className="text-2xl font-brand font-black text-slate-900 tracking-tight leading-none">Fuel Plan</h2>
            <div className="space-y-3">
              {[
                { time: 'Rise', name: 'Elite Porridge', macros: '500 kcal • 45g Protein', icon: '🥣' },
                { time: 'Active', name: 'Protocol Bowl', macros: '750 kcal • 55g Protein', icon: '🍲' },
                { time: 'Restore', name: 'Prime Cut & Greens', macros: '850 kcal • 65g Protein', icon: '🥩' }
              ].map((meal, i) => (
                <div key={i} className="bg-white p-4 rounded-[1.2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:bg-brand-50 transition-all duration-500">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm border border-slate-50">{meal.icon}</div>
                  <div className="flex-1">
                    <span className="text-[7px] font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{meal.time}</span>
                    <h4 className="text-base font-black text-slate-900 mt-1.5 leading-none">{meal.name}</h4>
                    <p className="text-slate-400 text-[9px] font-black mt-1 italic opacity-70">{meal.macros}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'progress':
        return (
          <div className="space-y-6 animate-fade-in transition-all">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-brand font-black text-slate-900 tracking-tight leading-none">Analysis</h2>
                <p className="text-slate-500 text-[11px] mt-1 font-black italic uppercase tracking-widest">Data Tracking Log</p>
              </div>
              <div className="flex gap-1.5 bg-white p-1 rounded-lg border border-slate-100 shadow-sm">
                <input 
                  type="number" 
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Lbs" 
                  className="bg-transparent border-none outline-none px-2 py-1 text-[9px] font-black w-16"
                />
                <button onClick={addWeightMetric} className="bg-brand-900 text-white px-3 py-1.5 rounded-md font-black text-[6px] uppercase tracking-widest shadow-md active:scale-95">Log Weight</button>
              </div>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Weight', val: state.metrics[currentUser?.id || '']?.slice(-1)[0]?.weight || '--', unit: 'lbs' },
                { label: 'Body Fat', val: '17.0', unit: '%' },
                { label: 'Volume', val: '42k', unit: 'kg' },
                { label: 'Peak Power', val: '8.5', unit: 'pts' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-4 rounded-[1rem] border border-slate-100 shadow-sm text-center transition-all">
                  <p className="text-[6px] font-black text-slate-300 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-lg font-black text-slate-900 leading-none">{s.val}</p>
                  <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-0.5">{s.unit}</p>
                </div>
              ))}
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-[1.2rem] border border-slate-100 shadow-sm transition-all duration-500">
              <h3 className="text-base font-brand font-black mb-4 text-slate-800 tracking-tight">Trajectory Data</h3>
              <MetricsChart data={state.metrics[currentUser?.id || ''] || []} />
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="flex flex-col h-[calc(100vh-10rem)] max-w-lg mx-auto animate-fade-in transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-9 h-9 bg-brand-900 rounded-lg flex items-center justify-center text-white font-brand font-black text-lg shadow-lg">J</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-500 border-[2px] border-[#FDFDFF] rounded-full" />
              </div>
              <div>
                <h2 className="text-base font-brand font-black text-slate-900 leading-none">Justin La Plante</h2>
                <p className="text-brand-700 text-[6px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 bg-brand-500 rounded-full" />
                  Lead Coach
                </p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pb-3 scrollbar-hide">
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-3 rounded-xl rounded-tl-none max-w-[85%] text-slate-700 shadow-sm text-[10px] italic font-black opacity-80">
                  Protocol active. Let's work.
                </div>
              </div>
              {state.messages
                .filter(m => m.senderId === currentUser?.id || m.receiverId === currentUser?.id)
                .map(m => (
                  <div key={m.id} className={`flex ${m.senderId === currentUser?.id ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`p-2.5 rounded-xl max-w-[85%] text-[10px] font-black leading-relaxed ${m.senderId === currentUser?.id ? 'bg-brand-900 text-white rounded-tr-none shadow-md' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100 shadow-inner'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex gap-2 p-1.5 bg-white rounded-xl border border-slate-100 shadow-lg mb-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Protocol Message..." 
                className="flex-1 bg-transparent border-none outline-none px-3 text-slate-900 font-black placeholder:text-slate-300 text-[10px]" 
              />
              <button onClick={sendChatMessage} className="w-8 h-8 bg-brand-900 text-white rounded-lg flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative transition-all duration-1000">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-600 animate-pulse" />
        <div className="max-w-xs w-full text-center relative z-10 animate-fade-in">
          <div className="w-12 h-12 bg-brand-600 rounded-xl mb-6 mx-auto flex items-center justify-center text-2xl font-black shadow-2xl transition-all hover:scale-110">
            {state.config.logoUrl ? (
              <img src={state.config.logoUrl} className="w-full h-full object-cover rounded-xl" />
            ) : 'L'}
          </div>
          <h1 className="text-2xl font-brand font-black mb-1 tracking-tight">{state.config.name}</h1>
          <p className="text-slate-500 mb-8 text-[9px] font-black uppercase tracking-[0.2em]">Elite Performance Protocol</p>
          
          <div className="space-y-2.5">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => handleLogin(UserRole.ADMIN)}
                  className="w-full bg-brand-600 text-white py-3 rounded-xl font-black text-xs hover:bg-brand-500 transition-all active:scale-95 shadow-xl shadow-brand-500/10 uppercase tracking-widest"
                >
                  Coach Portal
                </button>
                <button 
                  onClick={() => handleLogin(UserRole.CLIENT)}
                  className="w-full bg-slate-900 text-slate-400 py-3 rounded-xl font-black text-xs hover:bg-slate-800 transition-all border border-slate-800 active:scale-95 uppercase tracking-widest"
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
