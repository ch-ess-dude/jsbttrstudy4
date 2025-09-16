import React from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BookOpen, Clock, Brain, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">Just Better Study</span>
        </div>
        <Button 
          onClick={() => onNavigate('/login')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          Get Started
        </Button>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Turn your study materials into{' '}
              <span className="text-accent">smart, interactive</span> lessons.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Study smarter, not harder — with personalized tools built for focus.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => onNavigate('/login')}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 rounded-2xl text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Get Started
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center"
          >
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1625864667443-bc321825fcce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBtaW5pbWFsaXN0fGVufDF8fHx8MTc1Njg5MTU4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Student studying"
                className="w-full max-w-md rounded-3xl shadow-2xl"
              />
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-accent rounded-full opacity-70 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/20 rounded-full opacity-50 animate-pulse delay-1000"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything you need to study better
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful tools designed to enhance your learning experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Interactive Lessons",
                description: "Transform your notes into Duolingo-style micro-lessons with AI-powered content.",
                delay: 0.2
              },
              {
                icon: Clock,
                title: "Pomodoro Timer",
                description: "Stay focused with timed study sessions and built-in break reminders.",
                delay: 0.4
              },
              {
                icon: BookOpen,
                title: "Flashcards & Quizzes",
                description: "Test yourself and retain more knowledge with spaced repetition learning.",
                delay: 0.6
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: feature.delay }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="p-8 h-full text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card rounded-3xl">
                  <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-foreground mb-8">
              Your study tools — all in one place
            </h2>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1575388902449-6bca946ad549?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXNoYm9hcmQlMjBtb2NrdXAlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzU2ODI5ODE2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Dashboard preview"
                className="w-full rounded-3xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-3xl"></div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-card/30 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">Just Better Study</span>
            </div>
            <div className="flex space-x-6 text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
            © Just Better Study 2025. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}