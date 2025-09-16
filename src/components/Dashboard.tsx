import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  BookOpen, 
  Clock, 
  Brain, 
  BarChart, 
  User, 
  LogOut, 
  Upload, 
  Play,
  Eye,
  TrendingUp,
  Calendar,
  Zap,
  Timer,
  Plus,
  ArrowRight
} from 'lucide-react';
import { User as UserType, getStudySessions, getTodos, getActiveStudySession, createStudySession } from '../utils/supabase/client';

interface DashboardProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
  user: UserType | null;
}

export function Dashboard({ onNavigate, onLogout, user }: DashboardProps) {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [quickSessionName, setQuickSessionName] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);

  useEffect(() => {
    loadRecentActivity();
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      // Add timeout for active session check
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Active session timeout')), 5000);
      });
      
      const session = await Promise.race([
        getActiveStudySession(),
        timeout
      ]);
      setActiveSession(session);
    } catch (error) {
      console.error('Error checking active session:', error);
      setActiveSession(null);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Add timeout for dashboard data loading
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Dashboard data timeout')), 10000);
      });

      const [sessions, todos] = await Promise.race([
        Promise.all([
          getStudySessions(),
          getTodos()
        ]),
        timeout
      ]);

      // Combine and sort recent activities
      const activities = [
        ...sessions.filter(s => s.end_time).slice(0, 3).map(session => ({
          action: 'Completed study session',
          subject: `${session.session_name} • ${session.duration} min focused`,
          time: formatRelativeTime(new Date(session.end_time)),
          icon: Clock
        })),
        ...todos.filter(todo => todo.status === 'completed' && todo.completed_at).slice(0, 2).map(todo => ({
          action: 'Completed task',
          subject: todo.title,
          time: formatRelativeTime(new Date(todo.completed_at)),
          icon: Calendar
        }))
      ].sort((a, b) => {
        // Sort by a more complex time comparison since we now have different time formats
        const getTime = (item: any) => {
          if (item.time === 'just now') return Date.now();
          if (item.time.includes('hour')) return Date.now() - parseInt(item.time) * 60 * 60 * 1000;
          if (item.time.includes('day')) return Date.now() - parseInt(item.time) * 24 * 60 * 60 * 1000;
          return Date.now();
        };
        return getTime(b) - getTime(a);
      }).slice(0, 4);

      setRecentActivity(activities);
      setSessions(sessions);
      setTodos(todos);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      // Fallback to default activities if there's an error
      setRecentActivity([
        { action: 'Welcome to Just Better Study!', subject: 'Start your first study session', time: 'now', icon: Brain }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const sidebarItems = [
    { icon: BookOpen, label: 'Dashboard', route: '/dashboard', active: true },
    { icon: Clock, label: 'Timer', route: '/timer' },
    { icon: Calendar, label: 'Planner', route: '/planner' },
    { icon: Brain, label: 'Flashcards', route: '/flashcards' },
    { icon: BarChart, label: 'Analytics', route: '/analytics' },
    { icon: User, label: 'Profile', route: '/profile' },
  ];

  const startQuickSession = async () => {
    if (!quickSessionName.trim()) return;
    
    try {
      await createStudySession({
        session_name: quickSessionName,
        subject: 'General Study',
        start_time: new Date().toISOString(),
        duration: 0
      });
      
      setQuickSessionName('');
      onNavigate('/timer');
    } catch (error) {
      console.error('Error starting quick session:', error);
    }
  };

  const quickActions = [
    {
      icon: Upload,
      title: 'Upload Study Material',
      description: 'Transform notes into interactive lessons',
      status: 'Coming Soon',
      disabled: true
    },
    {
      icon: Play,
      title: activeSession ? 'Continue Session' : 'Start Pomodoro Session',
      description: activeSession ? `Resume "${activeSession.name}"` : 'Begin a focused study session',
      route: '/timer',
      highlighted: !!activeSession
    },
    {
      icon: Eye,
      title: 'View Flashcards',
      description: 'Practice with your flashcard decks',
      route: '/flashcards'
    },
    {
      icon: TrendingUp,
      title: 'Check Progress',
      description: 'See your study analytics',
      route: '/analytics'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-64 bg-card border-r border-border flex flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Just Better Study</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item, index) => (
            <motion.button
              key={item.route}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              onClick={() => onNavigate(item.route)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                item.active 
                  ? 'bg-accent text-accent-foreground shadow-lg' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card border-b border-border px-8 py-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
          </div>
          <Avatar className="w-10 h-10 cursor-pointer" onClick={() => onNavigate('/profile')}>
            <AvatarFallback className="bg-accent text-accent-foreground">
              {user?.name.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
        </motion.header>

        {/* Content */}
        <main className="flex-1 p-8 space-y-8">
          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: action.disabled ? 1 : 1.02, y: action.disabled ? 0 : -2 }}
                >
                  <Card 
                    className={`p-6 h-full cursor-pointer border-2 transition-all duration-300 rounded-2xl ${
                      action.disabled 
                        ? 'opacity-60 cursor-not-allowed border-border' 
                        : 'hover:border-accent hover:shadow-lg border-border'
                    }`}
                    onClick={() => !action.disabled && action.route && onNavigate(action.route)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        action.disabled ? 'bg-muted' : 'bg-accent'
                      }`}>
                        <action.icon className={`w-6 h-6 ${
                          action.disabled ? 'text-muted-foreground' : 'text-accent-foreground'
                        }`} />
                      </div>
                      {action.status && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          {action.status}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Recent Activity */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h2>
            <Card className="p-6 rounded-2xl border-2 border-border">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 rounded-xl animate-pulse">
                      <div className="w-10 h-10 bg-muted rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                      className="flex items-center space-x-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                        <activity.icon className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.subject}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{activity.time}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.section>

          {/* Stats Overview */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <h2 className="text-xl font-semibold text-foreground mb-6">This Week</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {(() => {
                const completedSessions = sessions.filter(s => s.end_time);
                const totalHours = completedSessions.reduce((total, s) => total + (s.duration / 60), 0);
                const weekAgo = new Date(Date.now() - 7*24*60*60*1000);
                const thisWeekHours = completedSessions
                  .filter(s => new Date(s.end_time) > weekAgo)
                  .reduce((total, s) => total + (s.duration / 60), 0);
                const completedTasks = todos.filter(t => t.status === 'completed');
                const pendingTasks = todos.filter(t => t.status === 'pending');
                
                return [
                  { 
                    label: 'Study Hours', 
                    value: totalHours.toFixed(1), 
                    icon: Clock, 
                    change: `+${thisWeekHours.toFixed(1)}h this week` 
                  },
                  { 
                    label: 'Study Sessions', 
                    value: completedSessions.length.toString(), 
                    icon: Timer, 
                    change: `${sessions.filter(s => !s.end_time).length} active` 
                  },
                  { 
                    label: 'Tasks Completed', 
                    value: completedTasks.length.toString(), 
                    icon: Zap, 
                    change: `${pendingTasks.length} pending` 
                  }
                ];
              })().map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.1 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="p-6 rounded-2xl border-2 border-border hover:border-accent transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className="w-8 h-8 text-accent" />
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}