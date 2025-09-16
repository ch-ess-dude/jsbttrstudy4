import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/middleware';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

app.use('*', logger(console.log));
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ===============================================
// AUTHENTICATION ROUTES
// ===============================================

app.post('/make-server-c21bec35/auth/signup', async (c) => {
  try {
    const { email, password, fullName } = await c.req.json();
    
    // Input validation
    if (!email || !password || !fullName) {
      return c.json({ error: 'Email, password, and full name are required' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Please enter a valid email address' }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters long' }, 400);
    }

    if (fullName.trim().length < 2) {
      return c.json({ error: 'Full name must be at least 2 characters long' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        full_name: fullName.trim(),
        auth_provider: 'email'
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Sign up error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Sign up error:', error);
    return c.json({ error: 'Sign up failed' }, 500);
  }
});

// ===============================================
// USER PROFILE ROUTES
// ===============================================

app.get('/make-server-c21bec35/user/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError) {
      console.log('Profile fetch error:', dbError);
      return c.json({ error: 'Failed to fetch profile' }, 500);
    }
    
    return c.json({ user: userData });
  } catch (error) {
    console.log('Profile fetch error:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

app.put('/make-server-c21bec35/user/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.log('Profile update error:', updateError);
      return c.json({ error: 'Failed to update profile' }, 500);
    }
    
    return c.json({ user: updatedUser });
  } catch (error) {
    console.log('Profile update error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// ===============================================
// STUDY SESSION ROUTES
// ===============================================

app.post('/make-server-c21bec35/study/session', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { session_name, subject, duration, start_time, end_time } = await c.req.json();
    
    if (!session_name || !subject || !start_time) {
      return c.json({ error: 'Session name, subject, and start time are required' }, 400);
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert([{
        user_id: user.id,
        session_name: session_name.trim(),
        subject: subject.trim(),
        duration: duration || 0,
        start_time,
        end_time
      }])
      .select()
      .single();

    if (sessionError) {
      console.log('Session creation error:', sessionError);
      return c.json({ error: 'Failed to create session' }, 500);
    }

    return c.json({ session });
  } catch (error) {
    console.log('Session creation error:', error);
    return c.json({ error: 'Failed to create session' }, 500);
  }
});

app.put('/make-server-c21bec35/study/session/:sessionId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    const updates = await c.req.json();
    
    const { data: session, error: updateError } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.log('Session update error:', updateError);
      return c.json({ error: 'Failed to update session' }, 500);
    }

    // Update analytics if session is completed
    if (updates.end_time && updates.duration && updates.subject) {
      await updateAnalyticsAfterSession(user.id, updates.subject, updates.duration);
    }

    return c.json({ session });
  } catch (error) {
    console.log('Session update error:', error);
    return c.json({ error: 'Failed to update session' }, 500);
  }
});

app.get('/make-server-c21bec35/study/sessions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.log('Sessions fetch error:', sessionsError);
      return c.json({ error: 'Failed to fetch sessions' }, 500);
    }

    return c.json({ sessions: sessions || [] });
  } catch (error) {
    console.log('Sessions fetch error:', error);
    return c.json({ error: 'Failed to fetch sessions' }, 500);
  }
});

app.get('/make-server-c21bec35/study/session/active', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('end_time', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionsError) {
      console.log('Active session fetch error:', sessionsError);
      return c.json({ error: 'Failed to fetch active session' }, 500);
    }

    return c.json({ session: sessions?.[0] || null });
  } catch (error) {
    console.log('Active session fetch error:', error);
    return c.json({ error: 'Failed to fetch active session' }, 500);
  }
});

// ===============================================
// TODO ROUTES
// ===============================================

app.get('/make-server-c21bec35/todos', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (todosError) {
      console.log('Todos fetch error:', todosError);
      return c.json({ error: 'Failed to fetch todos' }, 500);
    }

    return c.json({ todos: todos || [] });
  } catch (error) {
    console.log('Todos fetch error:', error);
    return c.json({ error: 'Failed to fetch todos' }, 500);
  }
});

app.post('/make-server-c21bec35/todos', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, description, status } = await c.req.json();
    
    if (!title?.trim()) {
      return c.json({ error: 'Todo title is required' }, 400);
    }

    const { data: todo, error: todoError } = await supabase
      .from('todos')
      .insert([{
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'pending'
      }])
      .select()
      .single();

    if (todoError) {
      console.log('Todo creation error:', todoError);
      return c.json({ error: 'Failed to create todo' }, 500);
    }

    return c.json({ todo });
  } catch (error) {
    console.log('Todo creation error:', error);
    return c.json({ error: 'Failed to create todo' }, 500);
  }
});

app.put('/make-server-c21bec35/todos/:todoId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const todoId = c.req.param('todoId');
    const updates = await c.req.json();
    
    const { data: todo, error: updateError } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', todoId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.log('Todo update error:', updateError);
      return c.json({ error: 'Failed to update todo' }, 500);
    }

    // Update analytics if task was completed
    if (updates.status === 'completed') {
      await updateAnalyticsAfterTaskCompletion(user.id);
    }

    return c.json({ todo });
  } catch (error) {
    console.log('Todo update error:', error);
    return c.json({ error: 'Failed to update todo' }, 500);
  }
});

app.delete('/make-server-c21bec35/todos/:todoId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const todoId = c.req.param('todoId');
    
    const { error: deleteError } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.log('Todo deletion error:', deleteError);
      return c.json({ error: 'Failed to delete todo' }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Todo deletion error:', error);
    return c.json({ error: 'Failed to delete todo' }, 500);
  }
});

// ===============================================
// ANALYTICS ROUTES
// ===============================================

app.get('/make-server-c21bec35/analytics', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (analyticsError && analyticsError.code !== 'PGRST116') {
      console.log('Analytics fetch error:', analyticsError);
      return c.json({ error: 'Failed to fetch analytics' }, 500);
    }

    // Get recent sessions for additional analytics
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .not('end_time', 'is', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.log('Recent sessions fetch error:', sessionsError);
    }

    // Calculate study hours data for the past week
    const studyHoursData = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayHours = (recentSessions || [])
        .filter(session => {
          const sessionDate = new Date(session.created_at);
          return sessionDate >= dayStart && sessionDate <= dayEnd;
        })
        .reduce((total, session) => total + (session.duration / 60), 0);
      
      studyHoursData.push({ day: dayName, hours: Math.round(dayHours * 10) / 10 });
    }

    // Calculate task completion data
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('status')
      .eq('user_id', user.id);

    const completedTasks = todos?.filter(todo => todo.status === 'completed').length || 0;
    const totalTasks = todos?.length || 0;
    
    const taskCompletionData = [
      { name: 'Completed', value: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0 },
      { name: 'Pending', value: totalTasks > 0 ? Math.round(((totalTasks - completedTasks) / totalTasks) * 100) : 100 }
    ];

    return c.json({
      studyHoursData,
      taskCompletionData,
      analytics: analytics || {
        total_sessions: 0,
        total_study_time: 0,
        total_completed_tasks: 0,
        subjects_breakdown: {}
      }
    });
  } catch (error) {
    console.log('Analytics fetch error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// ===============================================
// HELPER FUNCTIONS
// ===============================================

async function updateAnalyticsAfterSession(userId: string, subject: string, duration: number) {
  try {
    // Get current analytics
    const { data: analytics, error: fetchError } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.log('Error fetching analytics for update:', fetchError);
      return;
    }

    const currentAnalytics = analytics || {
      total_sessions: 0,
      total_study_time: 0,
      total_completed_tasks: 0,
      subjects_breakdown: {}
    };

    // Update subjects breakdown
    const updatedSubjectsBreakdown = { ...currentAnalytics.subjects_breakdown };
    updatedSubjectsBreakdown[subject] = (updatedSubjectsBreakdown[subject] || 0) + duration;

    // Upsert analytics
    const { error: upsertError } = await supabase
      .from('analytics')
      .upsert({
        user_id: userId,
        total_sessions: currentAnalytics.total_sessions + 1,
        total_study_time: currentAnalytics.total_study_time + duration,
        total_completed_tasks: currentAnalytics.total_completed_tasks,
        subjects_breakdown: updatedSubjectsBreakdown
      });

    if (upsertError) {
      console.log('Error updating analytics after session:', upsertError);
    }
  } catch (error) {
    console.log('Error in updateAnalyticsAfterSession:', error);
  }
}

async function updateAnalyticsAfterTaskCompletion(userId: string) {
  try {
    // Get current analytics
    const { data: analytics, error: fetchError } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.log('Error fetching analytics for task update:', fetchError);
      return;
    }

    const currentAnalytics = analytics || {
      total_sessions: 0,
      total_study_time: 0,
      total_completed_tasks: 0,
      subjects_breakdown: {}
    };

    // Upsert analytics
    const { error: upsertError } = await supabase
      .from('analytics')
      .upsert({
        user_id: userId,
        total_sessions: currentAnalytics.total_sessions,
        total_study_time: currentAnalytics.total_study_time,
        total_completed_tasks: currentAnalytics.total_completed_tasks + 1,
        subjects_breakdown: currentAnalytics.subjects_breakdown
      });

    if (upsertError) {
      console.log('Error updating analytics after task completion:', upsertError);
    }
  } catch (error) {
    console.log('Error in updateAnalyticsAfterTaskCompletion:', error);
  }
}

// ===============================================
// START SERVER
// ===============================================

Deno.serve(app.fetch);