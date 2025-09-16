import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  BookOpen, 
  Clock, 
  Brain, 
  BarChart, 
  User, 
  LogOut, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  Focus,
  Plus,
  Check,
  Trash2,
  Edit3,
  Coffee,
  Timer,
  Calendar
} from 'lucide-react';
import { 
  createStudySession, 
  updateStudySession, 
  getActiveStudySession, 
  createTodo,
  updateTodo,
  deleteTodo,
  getTodos,
  StudySession,
  Todo,
  User as UserType
} from '../utils/supabase/client';

interface TimerPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
  user: UserType;
}

type PomodoroPhase = 'work' | 'short-break' | 'long-break';

export function TimerPage({ onNavigate, onLogout, user }: TimerPageProps) {
  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>('work');
  const [cycleCount, setCycleCount] = useState(0);
  
  // Session state
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionSubject, setSessionSubject] = useState('General Study');
  
  // Tasks state
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  // Settings
  const [focusMode, setFocusMode] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [workDuration, setWorkDuration] = useState(user.preferences.defaultPomodoroTime);
  const [shortBreakDuration, setShortBreakDuration] = useState(user.preferences.defaultShortBreak);
  const [longBreakDuration, setLongBreakDuration] = useState(user.preferences.defaultLongBreak);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sidebarItems = [
    { icon: BookOpen, label: 'Dashboard', route: '/dashboard' },
    { icon: Clock, label: 'Timer', route: '/timer', active: true },
    { icon: Calendar, label: 'Planner', route: '/planner' },
    { icon: Brain, label: 'Flashcards', route: '/flashcards' },
    { icon: BarChart, label: 'Analytics', route: '/analytics' },
    { icon: User, label: 'Profile', route: '/profile' },
  ];

  const phases = {
    work: { duration: workDuration, label: 'Focus Time', icon: Timer },
    'short-break': { duration: shortBreakDuration, label: 'Short Break', icon: Coffee },
    'long-break': { duration: longBreakDuration, label: 'Long Break', icon: Coffee }
  };

  useEffect(() => {
    checkActiveSession();
    loadTasks();
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (timeLeft === 0 && isActive) {
        handlePhaseComplete();
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const checkActiveSession = async () => {
    try {
      const activeSession = await getActiveStudySession();
      if (activeSession) {
        setCurrentSession(activeSession);
        setSessionName(activeSession.session_name);
        setSessionSubject(activeSession.subject);
        // Calculate time left based on session start time
        const now = new Date();
        const sessionStart = new Date(activeSession.start_time);
        const elapsedMinutes = Math.floor((now.getTime() - sessionStart.getTime()) / 60000);
        const remainingTime = Math.max(0, (workDuration * 60) - (elapsedMinutes * 60));
        setTimeLeft(remainingTime);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const allTodos = await getTodos();
      setTasks(allTodos);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handlePhaseComplete = async () => {
    setIsActive(false);
    
    if (currentSession) {
      let nextPhase: PomodoroPhase;
      let newCycleCount = cycleCount;
      
      if (currentPhase === 'work') {
        newCycleCount += 1;
        nextPhase = newCycleCount % 4 === 0 ? 'long-break' : 'short-break';
        
        // Update session with completed work period
        await updateStudySession(currentSession.id, {
          duration: (currentSession.duration || 0) + workDuration
        });
      } else {
        nextPhase = 'work';
      }
      
      setCycleCount(newCycleCount);
      setCurrentPhase(nextPhase);
      setTimeLeft(phases[nextPhase].duration * 60);
      
      // Refresh session data
      checkActiveSession();
    }
  };

  const startSession = async () => {
    if (!sessionName.trim()) {
      setShowSessionDialog(true);
      return;
    }
    
    try {
      const session = await createStudySession({
        session_name: sessionName,
        subject: sessionSubject,
        start_time: new Date().toISOString(),
        duration: 0
      });
      
      setCurrentSession(session);
      setCurrentPhase('work');
      setTimeLeft(workDuration * 60);
      setIsActive(true);
      setShowSessionDialog(false);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleStart = () => {
    if (!currentSession) {
      setShowSessionDialog(true);
    } else {
      setIsActive(true);
    }
  };

  const handlePause = () => setIsActive(false);

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(phases[currentPhase].duration * 60);
  };

  const handleEndSession = async () => {
    if (!currentSession) return;
    
    try {
      await updateStudySession(currentSession.id, {
        end_time: new Date().toISOString(),
        duration: (currentSession.duration || 0) + Math.floor((phases[currentPhase].duration * 60 - timeLeft) / 60)
      });
      
      setCurrentSession(null);
      setIsActive(false);
      setCurrentPhase('work');
      setTimeLeft(workDuration * 60);
      setCycleCount(0);
      setSessionName('');
      setSessionSubject('General Study');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    try {
      const task = await createTodo({
        title: newTaskTitle,
        description: newTaskDescription || undefined,
        status: 'pending'
      });
      
      setTasks(prev => [...prev, task]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowTaskForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const updatedTask = await updateTodo(taskId, { 
        status: completed ? 'completed' : 'pending',
        completed_at: completed ? new Date().toISOString() : undefined
      });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTodo(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((phases[currentPhase].duration * 60 - timeLeft) / (phases[currentPhase].duration * 60)) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-accent text-accent-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const activeTasks = tasks.filter(t => t.status === 'pending');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Session Setup Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Study Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                placeholder="e.g., Math Chapter 5"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-subject">Subject</Label>
              <Input
                id="session-subject"
                placeholder="e.g., Mathematics"
                value={sessionSubject}
                onChange={(e) => setSessionSubject(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowSessionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={startSession} disabled={!sessionName.trim()}>
                Start Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className={`w-64 bg-card border-r border-border flex flex-col transition-all duration-500 ${
          focusMode ? 'opacity-20' : 'opacity-100'
        }`}
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
          className={`bg-card border-b border-border px-8 py-6 flex items-center justify-between transition-all duration-500 ${
            focusMode ? 'opacity-20' : 'opacity-100'
          }`}
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pomodoro Timer</h1>
            <p className="text-muted-foreground">
              {currentSession ? `Session: ${currentSession.session_name}` : 'Start a focused study session'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {currentSession && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{Math.floor((currentSession.duration || 0))} min focused</span>
                <Check className="w-4 h-4 ml-2" />
                <span>{completedTasks.length} tasks done</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMusicEnabled(!musicEnabled)}
              className="text-muted-foreground hover:text-foreground"
            >
              {musicEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Avatar className="w-10 h-10 cursor-pointer" onClick={() => onNavigate('/profile')}>
              {user.avatar_url && (
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
              )}
              <AvatarFallback className="bg-accent text-accent-foreground">
                {user.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.header>

        {/* Content */}
        <main className="flex-1 flex">
          {/* Timer Section */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full space-y-8">
              {/* Current Phase Indicator */}
              {currentSession && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    {React.createElement(phases[currentPhase].icon, { className: "w-6 h-6 text-accent" })}
                    <h2 className="text-xl font-semibold text-foreground">
                      {phases[currentPhase].label}
                    </h2>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <div className="text-sm text-muted-foreground">
                      Cycle {Math.floor(cycleCount / 2) + 1}/4
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Subject: {currentSession.subject}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Timer Circle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex justify-center"
              >
                <div className="relative w-80 h-80">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted/30"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className={currentPhase === 'work' ? 'text-accent' : 'text-chart-2'}
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progressPercentage / 100) }}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-foreground mb-2">
                        {formatTime(timeLeft)}
                      </div>
                      <div className="text-muted-foreground">
                        {isActive ? phases[currentPhase].label : 'Ready to Start'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Controls */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex justify-center space-x-4"
              >
                <Button
                  onClick={isActive ? handlePause : handleStart}
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {isActive ? <Pause className="w-6 h-6 mr-2" /> : <Play className="w-6 h-6 mr-2" />}
                  {isActive ? 'Pause' : 'Start'}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 rounded-2xl border-2 hover:border-accent transition-all duration-300"
                >
                  <RotateCcw className="w-6 h-6 mr-2" />
                  Reset
                </Button>
                {currentSession && (
                  <Button
                    onClick={handleEndSession}
                    variant="destructive"
                    size="lg"
                    className="px-8 py-4 rounded-2xl transition-all duration-300"
                  >
                    End Session
                  </Button>
                )}
              </motion.div>

              {/* Focus Mode Toggle */}
              {!currentSession && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  className={`transition-all duration-500 ${focusMode ? 'opacity-20' : 'opacity-100'}`}
                >
                  <Card className="p-6 rounded-2xl border-2 border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Focus className="w-6 h-6 text-accent" />
                        <div>
                          <Label htmlFor="focus-mode" className="font-semibold text-foreground">
                            Focus Mode
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Hide distractions and enhance concentration
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="focus-mode"
                        checked={focusMode}
                        onCheckedChange={setFocusMode}
                      />
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>

          {/* Tasks Panel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-96 bg-card border-l border-border p-6 overflow-y-auto"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Tasks</h3>
                <Button
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              {/* Add Task Form */}
              <AnimatePresence>
                {showTaskForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <Card className="p-4 rounded-xl border-2 border-dashed border-border">
                      <div className="space-y-3">
                        <Input
                          placeholder="Task title..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="rounded-xl"
                        />
                        <Textarea
                          placeholder="Description (optional)..."
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          className="rounded-xl resize-none"
                          rows={2}
                        />
                        <div className="flex items-center justify-between">
                          <div></div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => setShowTaskForm(false)}
                              variant="ghost"
                              size="sm"
                              className="rounded-xl"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCreateTask}
                              size="sm"
                              className="rounded-xl"
                              disabled={!newTaskTitle.trim()}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tasks List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        task.status === 'completed'
                          ? 'border-accent bg-accent/5 opacity-75' 
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => handleToggleTask(task.id, task.status !== 'completed')}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            task.status === 'completed'
                              ? 'bg-accent border-accent text-accent-foreground'
                              : 'border-muted-foreground hover:border-accent'
                          }`}
                        >
                          {task.status === 'completed' && <Check className="w-3 h-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-medium ${
                              task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}>
                              {task.title}
                            </h4>
                            <Button
                              onClick={() => handleDeleteTask(task.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          {task.description && (
                            <p className={`text-sm ${
                              task.status === 'completed' ? 'text-muted-foreground' : 'text-muted-foreground'
                            }`}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No tasks yet</p>
                    <p className="text-sm">Add a task to get started</p>
                  </div>
                )}
              </div>

              {/* Task Summary */}
              {tasks.length > 0 && (
                <Card className="p-4 rounded-xl bg-muted/30">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {completedTasks.length}/{tasks.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tasks Completed
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}