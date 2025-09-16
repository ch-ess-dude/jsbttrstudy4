import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';
import { 
  BookOpen, 
  Clock, 
  Brain, 
  BarChart, 
  User, 
  LogOut, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  CalendarDays,
  List,
  Trash2,
  Edit
} from 'lucide-react';

interface PlannerPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
  user: { name: string; email: string };
}

interface Task {
  id: string;
  title: string;
  notes: string;
  dueDate: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export function PlannerPage({ onNavigate, onLogout, user }: PlannerPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', notes: '', priority: 'medium' as const });

  const sidebarItems = [
    { icon: BookOpen, label: 'Dashboard', route: '/dashboard' },
    { icon: Clock, label: 'Timer', route: '/timer' },
    { icon: CalendarDays, label: 'Planner', route: '/planner', active: true },
    { icon: Brain, label: 'Flashcards', route: '/flashcards' },
    { icon: BarChart, label: 'Analytics', route: '/analytics' },
    { icon: User, label: 'Profile', route: '/profile' },
  ];

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Review Biology Chapter 5',
      notes: 'Focus on cell division and mitosis',
      dueDate: new Date(),
      completed: false,
      priority: 'high'
    },
    {
      id: '2',
      title: 'Math homework - Calculus',
      notes: 'Problems 15-30 from textbook',
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      completed: false,
      priority: 'medium'
    },
    {
      id: '3',
      title: 'History essay outline',
      notes: 'World War II causes and effects',
      dueDate: new Date(Date.now() + 172800000), // Day after tomorrow
      completed: true,
      priority: 'low'
    }
  ]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      task.dueDate.toDateString() === date.toDateString()
    );
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (newTask.title.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        notes: newTask.notes,
        dueDate: selectedDate,
        completed: false,
        priority: newTask.priority
      };
      setTasks([...tasks, task]);
      setNewTask({ title: '', notes: '', priority: 'medium' });
      setShowAddTask(false);
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const selectedDateTasks = getTasksForDate(selectedDate);

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
            <h1 className="text-2xl font-bold text-foreground">Study Planner</h1>
            <p className="text-muted-foreground">Organize your study schedule and tasks</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-muted rounded-xl p-1">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="rounded-lg"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-lg"
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
            <Avatar className="w-10 h-10 cursor-pointer" onClick={() => onNavigate('/profile')}>
              <AvatarFallback className="bg-accent text-accent-foreground">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.header>

        {/* Content */}
        <main className="flex-1 p-8">
          <div className="grid lg:grid-cols-2 gap-8 h-full">
            {/* Calendar/List View */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="p-6 h-full rounded-2xl border-2 border-border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">
                    {viewMode === 'calendar' ? 'Calendar' : 'All Tasks'}
                  </h2>
                  {viewMode === 'calendar' && (
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {viewMode === 'calendar' ? (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="w-full"
                  />
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(task.dueDate)}
                          </p>
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Task List for Selected Date */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="p-6 h-full rounded-2xl border-2 border-border">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {formatDate(selectedDate)}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedDateTasks.length} tasks scheduled
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAddTask(true)}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>

                {/* Add Task Form */}
                {showAddTask && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-muted/30 rounded-xl space-y-4"
                  >
                    <Input
                      placeholder="Task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="rounded-xl"
                    />
                    <Textarea
                      placeholder="Notes (optional)"
                      value={newTask.notes}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                      className="rounded-xl"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Priority:</span>
                      {['low', 'medium', 'high'].map((priority) => (
                        <Button
                          key={priority}
                          variant={newTask.priority === priority ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewTask({ ...newTask, priority: priority as any })}
                          className="rounded-lg capitalize"
                        >
                          {priority}
                        </Button>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={addTask} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl">
                        Add Task
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddTask(false)} className="rounded-xl">
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Task List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedDateTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tasks scheduled for this date</p>
                    </div>
                  ) : (
                    selectedDateTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(task.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {task.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteTask(task.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {task.notes && (
                              <p className="text-sm text-muted-foreground">{task.notes}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}