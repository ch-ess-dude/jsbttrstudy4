import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { 
  BookOpen, 
  Clock, 
  Brain, 
  BarChart as BarChartIcon, 
  User, 
  LogOut, 
  TrendingUp,
  Target,
  Calendar,
  Award,
  Timer,
  CheckCircle,
  Coffee,
  Flame
} from 'lucide-react';
import { getAnalytics, getStudySessions, User as UserType } from '../utils/supabase/client';

interface AnalyticsPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
  user: UserType;
}

interface AnalyticsData {
  studyHoursData: Array<{ day: string; hours: number; sessions: number }>;
  taskCompletionData: Array<{ name: string; value: number; color: string }>;
  sessionData: Array<{
    id: string;
    name: string;
    date: string;
    duration: number;
    tasksCompleted: number;
    pomodoroType: string;
  }>;
  streakData: Array<{ date: string; studied: boolean }>;
  stats: {
    totalStudyTime: number;
    tasksCompleted: number;
    cardsMastered: number;
    studyStreak: number;
    totalSessions: number;
    avgSessionLength: number;
    thisWeekHours: number;
    thisWeekSessions: number;
  };
}

export function AnalyticsPage({ onNavigate, onLogout, user }: AnalyticsPageProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const sidebarItems = [
    { icon: BookOpen, label: 'Dashboard', route: '/dashboard' },
    { icon: Clock, label: 'Timer', route: '/timer' },
    { icon: Brain, label: 'Flashcards', route: '/flashcards' },
    { icon: BarChartIcon, label: 'Analytics', route: '/analytics', active: true },
    { icon: User, label: 'Profile', route: '/profile' },
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Add timeout for analytics calls
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Analytics timeout')), 20000);
      });

      const [analyticsResponse, sessionsResponse] = await Promise.race([
        Promise.all([
          getAnalytics(),
          getStudySessions()
        ]),
        timeout
      ]);

      // Process sessions data
      const sessions = sessionsResponse || [];
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Filter sessions based on time range
      const getFilterDate = () => {
        switch (timeRange) {
          case 'week': return weekAgo;
          case 'month': return monthAgo;
          case 'year': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          default: return weekAgo;
        }
      };

      const filterDate = getFilterDate();
      const filteredSessions = sessions.filter(session => 
        session.completedAt && new Date(session.completedAt) >= filterDate
      );

      // Calculate daily study hours
      const studyHoursData = [];
      const daysToShow = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
      
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayName = timeRange === 'week' 
          ? date.toLocaleDateString('en-US', { weekday: 'short' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const daySessions = filteredSessions.filter(session => {
          const sessionDate = new Date(session.completedAt!);
          return sessionDate >= dayStart && sessionDate <= dayEnd;
        });
        
        const dayHours = daySessions.reduce((total, session) => 
          total + (session.totalFocusMinutes / 60), 0
        );
        
        studyHoursData.push({ 
          day: dayName, 
          hours: Math.round(dayHours * 10) / 10,
          sessions: daySessions.length 
        });
      }

      // Calculate task completion data
      const completedTasks = user.stats.tasksCompleted;
      const totalTasks = completedTasks + 10; // Approximate pending tasks
      const taskCompletionData = [
        { 
          name: 'Completed', 
          value: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0, 
          color: 'var(--chart-1)' 
        },
        { 
          name: 'Pending', 
          value: totalTasks > 0 ? Math.round(((totalTasks - completedTasks) / totalTasks) * 100) : 0, 
          color: 'var(--chart-2)' 
        }
      ];

      // Process session data for detailed view
      const sessionData = filteredSessions.map(session => ({
        id: session.id,
        name: session.name,
        date: new Date(session.startTime).toLocaleDateString(),
        duration: session.totalFocusMinutes,
        tasksCompleted: session.tasksCompleted,
        pomodoroType: session.pomodoroType
      }));

      // Calculate streak data
      const streakData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayHadSession = sessions.some(session => {
          if (!session.completedAt) return false;
          const sessionDate = new Date(session.completedAt);
          return sessionDate >= dayStart && sessionDate <= dayEnd;
        });
        
        streakData.push({
          date: date.toISOString().split('T')[0],
          studied: dayHadSession
        });
      }

      // Calculate enhanced stats
      const thisWeekSessions = sessions.filter(session => 
        session.completedAt && new Date(session.completedAt) >= weekAgo
      );
      
      const thisWeekHours = thisWeekSessions.reduce((total, session) => 
        total + (session.totalFocusMinutes / 60), 0
      );

      const avgSessionLength = sessions.length > 0 
        ? sessions.reduce((total, session) => total + session.totalFocusMinutes, 0) / sessions.length
        : 0;

      setAnalyticsData({
        studyHoursData,
        taskCompletionData,
        sessionData: sessionData.slice(0, 10), // Show last 10 sessions
        streakData,
        stats: {
          ...user.stats,
          totalSessions: sessions.length,
          avgSessionLength: Math.round(avgSessionLength),
          thisWeekHours: Math.round(thisWeekHours * 10) / 10,
          thisWeekSessions: thisWeekSessions.length
        }
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Set fallback data to prevent complete failure
      setAnalyticsData({
        studyHoursData: [],
        taskCompletionData: [
          { name: 'Completed', value: 0, color: 'var(--chart-1)' },
          { name: 'Pending', value: 100, color: 'var(--chart-2)' }
        ],
        sessionData: [],
        streakData: [],
        stats: {
          totalStudyTime: 0,
          tasksCompleted: 0,
          cardsMastered: 0,
          studyStreak: 0,
          totalSessions: 0,
          avgSessionLength: 0,
          thisWeekHours: 0,
          thisWeekSessions: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const achievements = [
    { 
      name: 'First Session', 
      description: 'Complete your first study session', 
      earned: analyticsData?.stats.totalSessions > 0,
      icon: Timer
    },
    { 
      name: 'Task Master', 
      description: 'Complete 10 tasks', 
      earned: analyticsData?.stats.tasksCompleted >= 10,
      icon: CheckCircle
    },
    { 
      name: 'Week Warrior', 
      description: 'Study 7 days in a row', 
      earned: analyticsData?.stats.studyStreak >= 7,
      icon: Flame
    },
    { 
      name: 'Marathon Runner', 
      description: 'Study for 20+ hours total', 
      earned: analyticsData?.stats.totalStudyTime >= 20 * 60,
      icon: Award
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BarChartIcon className="w-5 h-5 text-accent-foreground" />
          </div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-64 bg-card border-r border-border flex flex-col"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Just Better Study</span>
          </div>
        </div>

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
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Track your study progress and performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-muted rounded-xl p-1">
              {['week', 'month', 'year'].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange(range as any)}
                  className="rounded-lg capitalize"
                >
                  {range}
                </Button>
              ))}
            </div>
            <Avatar className="w-10 h-10 cursor-pointer" onClick={() => onNavigate('/profile')}>
              {user.profilePicture && (
                <AvatarImage src={user.profilePicture} alt={user.name} />
              )}
              <AvatarFallback className="bg-accent text-accent-foreground">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.header>

        {/* Content */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 lg:w-96">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="achievements">Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Stats Overview */}
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h2 className="text-xl font-semibold text-foreground mb-6">This {timeRange}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      icon: Clock,
                      label: 'Study Time',
                      value: timeRange === 'week' 
                        ? `${analyticsData?.stats.thisWeekHours || 0} hrs` 
                        : `${Math.round((analyticsData?.stats.totalStudyTime || 0) / 60)} hrs`,
                      change: `+${analyticsData?.stats.thisWeekHours || 0}h this week`,
                      changeType: 'positive'
                    },
                    {
                      icon: Timer,
                      label: 'Sessions',
                      value: timeRange === 'week' 
                        ? `${analyticsData?.stats.thisWeekSessions || 0}` 
                        : `${analyticsData?.stats.totalSessions || 0}`,
                      change: `Avg ${analyticsData?.stats.avgSessionLength || 0}min`,
                      changeType: 'neutral'
                    },
                    {
                      icon: Target,
                      label: 'Tasks Done',
                      value: `${analyticsData?.stats.tasksCompleted || 0}`,
                      change: `+${Math.floor((analyticsData?.stats.tasksCompleted || 0) * 0.2)} this week`,
                      changeType: 'positive'
                    },
                    {
                      icon: Flame,
                      label: 'Study Streak',
                      value: `${analyticsData?.stats.studyStreak || 0} days`,
                      change: analyticsData?.stats.studyStreak > 0 ? 'Keep it up!' : 'Start today!',
                      changeType: analyticsData?.stats.studyStreak > 0 ? 'positive' : 'neutral'
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="p-6 rounded-2xl border-2 border-border hover:border-accent transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <stat.icon className="w-8 h-8 text-accent" />
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            stat.changeType === 'positive' 
                              ? 'bg-accent/20 text-accent' 
                              : 'bg-muted/50 text-muted-foreground'
                          }`}>
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

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Study Hours Chart */}
                <motion.section
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <Card className="p-6 rounded-2xl border-2 border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Study Hours - {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData?.studyHoursData}>
                          <defs>
                            <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis 
                            dataKey="day" 
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                              borderRadius: '12px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="hours" 
                            stroke="var(--accent)" 
                            strokeWidth={3}
                            fill="url(#studyGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </motion.section>

                {/* Task Completion Chart */}
                <motion.section
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <Card className="p-6 rounded-2xl border-2 border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Task Completion</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData?.taskCompletionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsData?.taskCompletionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center space-x-4 mt-4">
                      {analyticsData?.taskCompletionData.map((entry, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {entry.name}: {entry.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.section>
              </div>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-6">
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="p-6 rounded-2xl border-2 border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Recent Sessions</h3>
                  <div className="space-y-4">
                    {analyticsData?.sessionData?.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-accent transition-all duration-300"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                            <Timer className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{session.name}</h4>
                            <p className="text-sm text-muted-foreground">{session.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-foreground">{session.duration}m</div>
                            <div className="text-muted-foreground">Focus time</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-foreground">{session.tasksCompleted}</div>
                            <div className="text-muted-foreground">Tasks done</div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {session.pomodoroType.replace('-', ' ')}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                    {(!analyticsData?.sessionData || analyticsData.sessionData.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Timer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No study sessions yet</p>
                        <p className="text-sm">Start your first session to see data here</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.section>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="p-6 rounded-2xl border-2 border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Study Streak Calendar</h3>
                  <div className="grid grid-cols-10 gap-2">
                    {analyticsData?.streakData?.map((day, index) => (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                          day.studied 
                            ? 'bg-accent text-accent-foreground shadow-lg' 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                        title={new Date(day.date).toLocaleDateString()}
                      >
                        {new Date(day.date).getDate()}
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>Less</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-muted rounded-sm"></div>
                      <div className="w-3 h-3 bg-accent/30 rounded-sm"></div>
                      <div className="w-3 h-3 bg-accent/60 rounded-sm"></div>
                      <div className="w-3 h-3 bg-accent rounded-sm"></div>
                    </div>
                    <span>More</span>
                  </div>
                </Card>
              </motion.section>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-xl font-semibold text-foreground mb-6">Achievements</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                        achievement.earned 
                          ? 'border-accent bg-accent/5 shadow-lg' 
                          : 'border-border opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            achievement.earned ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            <achievement.icon className="w-6 h-6" />
                          </div>
                          {achievement.earned && (
                            <Badge className="bg-accent text-accent-foreground">Earned</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}