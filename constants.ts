
import { UserRole, User, WorkoutProgram, NutritionPlan, Metric, Tip } from './types';

export const ADMIN_USER: User = {
  id: 'admin-1',
  name: 'Justin La Plante',
  email: 'justin@laplantefitness.com',
  phone: '555-0100',
  role: UserRole.ADMIN,
  avatar: 'https://picsum.photos/seed/justin/200'
};

export const DEMO_CLIENTS: User[] = [
  { id: 'c-1', name: 'Alex Thompson', email: 'alex@example.com', phone: '555-0123', role: UserRole.CLIENT, avatar: 'https://picsum.photos/seed/alex/200', todayStatus: 'Completed' },
  { id: 'c-2', name: 'Sarah Miller', email: 'sarah@example.com', phone: '555-0145', role: UserRole.CLIENT, avatar: 'https://picsum.photos/seed/sarah/200', todayStatus: 'In Progress' },
  { id: 'c-3', name: 'James Wilson', email: 'james@example.com', phone: '555-0167', role: UserRole.CLIENT, avatar: 'https://picsum.photos/seed/james/200', todayStatus: 'Not Started' },
];

export const INITIAL_TIPS: Tip[] = [
  { id: 't-1', title: 'The Power of Consistency', category: 'Mindset', content: 'Consistency beats intensity every single time. Focus on showing up today.', date: '2024-05-15' },
  { id: 't-2', title: 'Pre-Workout Fueling', category: 'Nutrition', content: 'Consume moderate protein and slow-digesting carbs 90 minutes before your lift.', date: '2024-05-18' },
];

export const INITIAL_METRICS: Record<string, Metric[]> = {
  'c-1': [
    { date: '2024-05-01', weight: 185, bodyFat: 18, strengthScore: 120 },
    { date: '2024-05-08', weight: 184, bodyFat: 17.5, strengthScore: 125 },
    { date: '2024-05-15', weight: 182, bodyFat: 17, strengthScore: 130 },
  ],
  'c-2': [
    { date: '2024-05-01', weight: 145, bodyFat: 22, strengthScore: 80 },
    { date: '2024-05-15', weight: 143, bodyFat: 21, strengthScore: 85 },
  ],
  'c-3': [
    { date: '2024-05-15', weight: 210, bodyFat: 25, strengthScore: 150 },
  ]
};

export const COLORS = {
  primary: '#59A541', 
  secondary: '#1e293b',
  accent: '#59A541',
  background: '#f8fafc',
};
