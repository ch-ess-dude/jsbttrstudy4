import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

// Database Interfaces
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  auth_provider: 'email' | 'google' | 'apple';
  created_at: string;
  preferences: {
    darkMode: boolean;
    notifications: boolean;
    defaultPomodoroTime: number;
    defaultShortBreak: number;
    defaultLongBreak: number;
    studyGoal: number;
  };
}

export interface StudySession {
  id: string;
  user_id: string;
  session_name: string;
  subject: string;
  duration: number; // in minutes
  start_time: string;
  end_time?: string;
  created_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at?: string;
}

export interface Analytics {
  id: string;
  user_id: string;
  total_sessions: number;
  total_study_time: number; // in minutes
  total_completed_tasks: number;
  subjects_breakdown: Record<string, number>; // subject -> minutes
  updated_at: string;
}

// Input validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Authentication functions
export async function signUp(email: string, password: string, fullName: string) {
  // Input validation
  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address');
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join('. '));
  }
  
  if (!fullName.trim() || fullName.length < 2) {
    throw new Error('Full name must be at least 2 characters long');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        auth_provider: 'email'
      },
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    if (error.message.includes('email_address_not_confirmed')) {
      throw new Error('Please check your email and click the confirmation link before signing in.');
    }
    throw error;
  }
  return data;
}

export async function signIn(email: string, password: string) {
  if (!validateEmail(email)) {
    throw new Error('Please enter a valid email address');
  }
  
  if (!password) {
    throw new Error('Password is required');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('email_address_not_confirmed')) {
      throw new Error('Please check your email and click the confirmation link to verify your account before signing in.');
    }
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    }
    throw error;
  }
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// User functions
export async function getUserProfile(): Promise<User> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // User profile doesn't exist, create it
        return await createUserProfile(user);
      }
      if (error.code === 'PGRST205') {
        // Table doesn't exist - database not set up
        throw new Error('DATABASE_NOT_SETUP');
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    if (error.message === 'DATABASE_NOT_SETUP') {
      throw error;
    }
    // Fallback: try to create user profile
    try {
      return await createUserProfile(user);
    } catch (createError) {
      throw new Error('DATABASE_NOT_SETUP');
    }
  }
}

async function createUserProfile(authUser: any): Promise<User> {
  const userData = {
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
    avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
    auth_provider: authUser.user_metadata?.auth_provider || getAuthProvider(authUser),
    preferences: {
      darkMode: false,
      notifications: true,
      defaultPomodoroTime: 25,
      defaultShortBreak: 5,
      defaultLongBreak: 15,
      studyGoal: 20
    }
  };

  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) throw error;

  // Initialize analytics for the user
  await initializeUserAnalytics(authUser.id);

  return data;
}

function getAuthProvider(authUser: any): 'email' | 'google' | 'apple' {
  const identities = authUser.identities || [];
  if (identities.some((identity: any) => identity.provider === 'google')) return 'google';
  if (identities.some((identity: any) => identity.provider === 'apple')) return 'apple';
  return 'email';
}

async function initializeUserAnalytics(userId: string) {
  const { error } = await supabase
    .from('analytics')
    .insert([{
      user_id: userId,
      total_sessions: 0,
      total_study_time: 0,
      total_completed_tasks: 0,
      subjects_breakdown: {}
    }]);

  if (error && error.code !== '23505') { // Ignore duplicate key error
    console.error('Error initializing analytics:', error);
  }
}

export async function updateUserProfile(updates: Partial<User>): Promise<User> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Study session functions
export async function createStudySession(sessionData: Omit<StudySession, 'id' | 'user_id' | 'created_at'>): Promise<StudySession> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('sessions')
    .insert([{
      ...sessionData,
      user_id: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStudySession(sessionId: string, updates: Partial<StudySession>): Promise<StudySession> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  // Update analytics if session is completed
  if (updates.end_time && updates.duration) {
    await updateAnalyticsAfterSession(updates.subject!, updates.duration);
  }

  return data;
}

export async function getStudySessions(): Promise<StudySession[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getActiveStudySession(): Promise<StudySession | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .is('end_time', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

// Todo functions
export async function getTodos(): Promise<Todo[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTodo(todo: Omit<Todo, 'id' | 'user_id' | 'created_at'>): Promise<Todo> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  if (!todo.title?.trim()) {
    throw new Error('Todo title is required');
  }

  const { data, error } = await supabase
    .from('todos')
    .insert([{
      ...todo,
      user_id: user.id,
      title: todo.title.trim()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTodo(todoId: string, updates: Partial<Todo>): Promise<Todo> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', todoId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  // Update analytics if task was completed
  if (updates.status === 'completed') {
    await updateAnalyticsAfterTaskCompletion();
  }

  return data;
}

export async function deleteTodo(todoId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', todoId)
    .eq('user_id', user.id);

  if (error) throw error;
}

// Analytics functions
export async function getAnalytics(): Promise<Analytics> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('analytics')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Analytics doesn't exist, create it
      await initializeUserAnalytics(user.id);
      return getAnalytics(); // Recursive call to get the newly created analytics
    }
    throw error;
  }

  return data;
}

async function updateAnalyticsAfterSession(subject: string, duration: number) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const analytics = await getAnalytics();
  
  const updatedSubjectsBreakdown = { ...analytics.subjects_breakdown };
  updatedSubjectsBreakdown[subject] = (updatedSubjectsBreakdown[subject] || 0) + duration;

  const { error } = await supabase
    .from('analytics')
    .update({
      total_sessions: analytics.total_sessions + 1,
      total_study_time: analytics.total_study_time + duration,
      subjects_breakdown: updatedSubjectsBreakdown,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (error) throw error;
}

async function updateAnalyticsAfterTaskCompletion() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const analytics = await getAnalytics();

  const { error } = await supabase
    .from('analytics')
    .update({
      total_completed_tasks: analytics.total_completed_tasks + 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (error) throw error;
}

// Real-time subscriptions
export function subscribeToUserProfile(userId: string, callback: (user: User) => void) {
  return supabase
    .channel('user_profile')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'users',
      filter: `id=eq.${userId}`
    }, (payload) => {
      if (payload.new) {
        callback(payload.new as User);
      }
    })
    .subscribe();
}

export function subscribeToStudySessions(userId: string, callback: (sessions: StudySession[]) => void) {
  return supabase
    .channel('study_sessions')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'sessions',
      filter: `user_id=eq.${userId}`
    }, async () => {
      // Refetch all sessions when any change occurs
      const sessions = await getStudySessions();
      callback(sessions);
    })
    .subscribe();
}

export function subscribeToTodos(userId: string, callback: (todos: Todo[]) => void) {
  return supabase
    .channel('todos')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'todos',
      filter: `user_id=eq.${userId}`
    }, async () => {
      // Refetch all todos when any change occurs
      const todos = await getTodos();
      callback(todos);
    })
    .subscribe();
}

export function subscribeToAnalytics(userId: string, callback: (analytics: Analytics) => void) {
  return supabase
    .channel('analytics')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'analytics',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      if (payload.new) {
        callback(payload.new as Analytics);
      }
    })
    .subscribe();
}