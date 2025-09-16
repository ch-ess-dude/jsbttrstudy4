import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle, User } from 'lucide-react';
import { signIn, signInWithGoogle, signInWithApple, signUp, validateEmail, validatePassword } from '../utils/supabase/client';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        // Validate inputs before sending to server
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

        const result = await signUp(email, password, fullName);
        if (result.user && !result.session) {
          setSuccess('Account created! Please check your email and click the confirmation link, then sign in.');
        } else {
          setSuccess('Account created successfully! You can now sign in.');
        }
        // Reset form and switch to sign in mode
        setIsSignUp(false);
        setPassword('');
        setFullName('');
      } else {
        await signIn(email, password);
        // Navigation will be handled by the auth state change listener in App.tsx
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || `Failed to ${isSignUp ? 'sign up' : 'sign in'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      // OAuth redirect will handle the rest
    } catch (error: any) {
      console.error('Google sign in error:', error);
      if (error.message?.includes('provider')) {
        setError('Google sign-in needs to be configured. Please follow the setup instructions at https://supabase.com/docs/guides/auth/social-login/auth-google');
      } else {
        setError('Google sign-in failed. Please try again or use email/password.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    setError('');

    try {
      await signInWithApple();
      // OAuth redirect will handle the rest
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      if (error.message?.includes('provider')) {
        setError('Apple sign-in needs to be configured. Please follow the setup instructions for Apple OAuth in your Supabase dashboard.');
      } else {
        setError('Apple sign-in failed. Please try again or use email/password.');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center space-x-2 mb-4"
          >
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Just Better Study</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground"
          >
            {isSignUp ? 'Create your account to start studying' : 'Welcome back! Sign in to continue your learning journey.'}
          </motion.p>
        </div>

        <Card className="p-8 border-0 shadow-xl rounded-3xl bg-card">
          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-center space-x-2"
            >
              <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-accent-foreground rounded-full" />
              </div>
              <p className="text-sm text-accent-foreground">{success}</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center space-x-2"
            >
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          {/* Toggle Sign In/Sign Up */}
          <div className="mb-6">
            <div className="flex items-center justify-center bg-muted rounded-2xl p-1">
              <Button
                variant={!isSignUp ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                  setSuccess('');
                }}
                className="rounded-xl flex-1"
              >
                Sign In
              </Button>
              <Button
                variant={isSignUp ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                  setSuccess('');
                }}
                className="rounded-xl flex-1"
              >
                Sign Up
              </Button>
            </div>
          </div>

          {/* Social Sign-In Buttons */}
          <div className="space-y-4 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading || appleLoading}
                variant="outline"
                className="w-full py-6 border-2 hover:border-accent transition-all duration-300 rounded-2xl hover:shadow-lg disabled:opacity-50"
              >
                {googleLoading ? (
                  <>
                    <div className="w-5 h-5 mr-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Button
                onClick={handleAppleSignIn}
                disabled={loading || googleLoading || appleLoading}
                variant="outline"
                className="w-full py-6 border-2 hover:border-accent transition-all duration-300 rounded-2xl hover:shadow-lg disabled:opacity-50"
              >
                {appleLoading ? (
                  <>
                    <div className="w-5 h-5 mr-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Continue with Apple
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          <div className="relative mb-6">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-card px-4 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 py-6 rounded-2xl border-2 focus:border-accent transition-all duration-300"
                    placeholder="Enter your full name"
                    required={isSignUp}
                    minLength={2}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 py-6 rounded-2xl border-2 focus:border-accent transition-all duration-300"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 py-6 rounded-2xl border-2 focus:border-accent transition-all duration-300"
                  placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                  required
                  minLength={isSignUp ? 8 : 1}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isSignUp && (
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                    <li>One special character</li>
                  </ul>
                </div>
              )}
            </div>

            {!isSignUp && (
              <div className="text-right">
                <a href="#" className="text-accent hover:text-accent/80 transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={loading || googleLoading || appleLoading}
                className="w-full py-6 bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </motion.div>
          </motion.form>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-8 text-center"
        >
          <Button
            variant="ghost"
            onClick={() => onNavigate('/')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}