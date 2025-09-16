import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { 
  BookOpen, 
  Clock, 
  Brain, 
  BarChart, 
  User, 
  LogOut, 
  Camera,
  Moon,
  Sun,
  Bell,
  Shield,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
  user: { name: string; email: string };
  setUser: (user: { name: string; email: string }) => void;
}

export function ProfilePage({ onNavigate, onLogout, user, setUser }: ProfilePageProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const sidebarItems = [
    { icon: BookOpen, label: 'Dashboard', route: '/dashboard' },
    { icon: Clock, label: 'Timer', route: '/timer' },
    { icon: Brain, label: 'Flashcards', route: '/flashcards' },
    { icon: BarChart, label: 'Analytics', route: '/analytics' },
    { icon: User, label: 'Profile', route: '/profile', active: true },
  ];

  const handleSave = () => {
    setUser({ name: formData.name, email: formData.email });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(false);
  };

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
            <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-accent text-accent-foreground text-lg">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </motion.header>

        {/* Content */}
        <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="space-y-8">
            {/* Profile Picture Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="p-8 rounded-2xl border-2 border-border">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarFallback className="bg-accent text-accent-foreground text-2xl">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors">
                      <Camera className="w-4 h-4 text-accent-foreground" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">{user.name}</h2>
                    <p className="text-muted-foreground mb-3">{user.email}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="rounded-xl"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.section>

            {/* Account Information */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="p-8 rounded-2xl border-2 border-border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
                  {!isEditing && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={!isEditing}
                          className="pl-10 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6"
                    >
                      <Separator />
                      
                      <h4 className="font-medium text-foreground">Change Password</h4>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? "text" : "password"}
                              value={formData.currentPassword}
                              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                              className="pr-10 rounded-xl"
                              placeholder="Current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="rounded-xl"
                            placeholder="New password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="rounded-xl"
                            placeholder="Confirm password"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <Button 
                          onClick={handleSave}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
                        >
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancel}
                          className="rounded-xl"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.section>

            {/* Preferences */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card className="p-8 rounded-2xl border-2 border-border">
                <h3 className="text-lg font-semibold text-foreground mb-6">Preferences</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {darkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
                      <div>
                        <Label htmlFor="darkMode" className="font-medium">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                      </div>
                    </div>
                    <Switch
                      id="darkMode"
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="notifications" className="font-medium">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive study reminders and updates</p>
                      </div>
                    </div>
                    <Switch
                      id="notifications"
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label className="font-medium">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Enable
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.section>

            {/* Study Preferences */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <Card className="p-8 rounded-2xl border-2 border-border">
                <h3 className="text-lg font-semibold text-foreground mb-6">Study Preferences</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Default Pomodoro Duration</Label>
                    <div className="flex space-x-2">
                      {[15, 25, 45].map((minutes) => (
                        <Button
                          key={minutes}
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                        >
                          {minutes}m
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Study Goal (hours/week)</Label>
                    <Input
                      type="number"
                      defaultValue="20"
                      className="rounded-xl"
                      min="1"
                      max="168"
                    />
                  </div>
                </div>
              </Card>
            </motion.section>

            {/* Danger Zone */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <Card className="p-8 rounded-2xl border-2 border-destructive/20 bg-destructive/5">
                <h3 className="text-lg font-semibold text-destructive mb-6">Danger Zone</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Delete Account</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" className="rounded-xl">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.section>
          </div>
        </main>
      </div>
    </div>
  );
}