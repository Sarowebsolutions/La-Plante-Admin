
export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  todayStatus?: 'Completed' | 'In Progress' | 'Not Started';
  lastEnergy?: number;
}

export interface BusinessConfig {
  name: string;
  logoUrl?: string;
}

export interface LoggedSet {
  weight: number;
  reps: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  notes: string;
  completed?: boolean;
  loggedSets?: LoggedSet[];
}

export interface WorkoutProgram {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
  date: string;
  isCompleted?: boolean;
}

export interface Meal {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface NutritionPlan {
  id: string;
  dailyGoalCalories: number;
  meals: Meal[];
}

export interface Metric {
  date: string;
  weight: number;
  bodyFat?: number;
  strengthScore: number;
  energy?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

export interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
}

export interface AppState {
  currentUser: User | null;
  clients: User[];
  workouts: Record<string, WorkoutProgram[]>;
  nutrition: Record<string, NutritionPlan>;
  metrics: Record<string, Metric[]>;
  messages: ChatMessage[];
  tips: Tip[];
  config: BusinessConfig;
}
