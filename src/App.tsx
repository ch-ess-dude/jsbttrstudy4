import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SetupPage } from './components/SetupPage';
import { Dashboard } from './components/Dashboard';
import { TimerPage } from './components/TimerPage';
import { PlannerPage } from './components/PlannerPage';
import { FlashcardsPage } from './components/FlashcardsPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ProfilePage } from './components/ProfilePage';
import { supabase, getCurrentSession, getUserProfile, signOut, User } from './utils/supabase/client';

type Route = '/' | '/login' | '/setup' | '/dashboard' | '/timer' | '/planner' | '/flashcards' | '/analytics' | '/profile';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('/');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [databaseSetupRequired, setDatabaseSetupRequired] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Check for existing session on app load
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session) {
        setAuthLoading(true);
        setIsAuthenticated(true);
        try {
          const userData = await loadUserData();
          if (mounted) {
            setUser(userData);
            setDatabaseSetupRequired(false);
            navigate('/dashboard');
          }
        } catch (error: any) {
          console.error('Error handling user authentication:', error);
          if (mounted) {
            if (error.message === 'DATABASE_NOT_SETUP') {
              setDatabaseSetupRequired(true);
              navigate('/setup');
            } else {
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } finally {
          if (mounted) setAuthLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
          navigate('/');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (): Promise<User> => {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000);
    });

    try {
      // Get user profile (will auto-create if doesn't exist)
      return await Promise.race([getUserProfile(), timeoutPromise]);
    } catch (error) {
      console.error('Failed to load user data:', error);
      throw error;
    }
  };

  const checkSession = async () => {
    try {
      // Add timeout for session check
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Session check timeout')), 8000);
      });
      
      const session = await Promise.race([getCurrentSession(), timeoutPromise]);
      
      if (session) {
        setIsAuthenticated(true);
        try {
          const userData = await loadUserData();
          setUser(userData);
          setDatabaseSetupRequired(false);
          if (currentRoute === '/' || currentRoute === '/login' || currentRoute === '/setup') {
            navigate('/dashboard');
          }
        } catch (error: any) {
          console.error('Error fetching/initializing user profile:', error);
          if (error.message === 'DATABASE_NOT_SETUP') {
            setDatabaseSetupRequired(true);
            navigate('/setup');
          } else {
            // Don't fail completely, let user try to re-authenticate
            setIsAuthenticated(false);
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // On timeout or error, don't block the app
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const navigate = (route: Route) => {
    setCurrentRoute(route);
  };

  const logout = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUser(null);
      setDatabaseSetupRequired(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const retrySetup = () => {
    setDatabaseSetupRequired(false);
    setLoading(true);
    checkSession();
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5
  };

  const renderPage = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-accent-foreground font-bold">JBS</span>
            </div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    if (authLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4 animate-spin">
              <span className="text-accent-foreground font-bold">JBS</span>
            </div>
            <p className="text-muted-foreground">Signing you in...</p>
          </div>
        </div>
      );
    }

    // Show setup page if database is not configured
    if (databaseSetupRequired || currentRoute === '/setup') {
      return <SetupPage onNavigate={navigate} onRetry={retrySetup} />;
    }

    // Protect authenticated routes
    if (!isAuthenticated && ['/dashboard', '/timer', '/planner', '/flashcards', '/analytics', '/profile'].includes(currentRoute)) {
      return <LoginPage onNavigate={navigate} />;
    }

    switch (currentRoute) {
      case '/':
        return <LandingPage onNavigate={navigate} />;
      case '/login':
        return <LoginPage onNavigate={navigate} />;
      case '/dashboard':
        return <Dashboard onNavigate={navigate} onLogout={logout} user={user} />;
      case '/timer':
        return <TimerPage onNavigate={navigate} onLogout={logout} user={user} />;
      case '/planner':
        return <PlannerPage onNavigate={navigate} onLogout={logout} user={user} />;
      case '/flashcards':
        return <FlashcardsPage onNavigate={navigate} onLogout={logout} user={user} />;
      case '/analytics':
        return <AnalyticsPage onNavigate={navigate} onLogout={logout} user={user} />;
      case '/profile':
        return <ProfilePage onNavigate={navigate} onLogout={logout} user={user} setUser={setUser} />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRoute}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="min-h-screen"
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}