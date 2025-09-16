import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  BookOpen, 
  Clock, 
  Brain, 
  BarChart, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';

interface FlashcardsPageProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
  user: { name: string; email: string };
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

interface Deck {
  id: string;
  name: string;
  description: string;
  cards: Flashcard[];
  lastStudied: Date;
  progress: number;
}

export function FlashcardsPage({ onNavigate, onLogout, user }: FlashcardsPageProps) {
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const sidebarItems = [
    { icon: BookOpen, label: 'Dashboard', route: '/dashboard' },
    { icon: Clock, label: 'Timer', route: '/timer' },
    { icon: Brain, label: 'Flashcards', route: '/flashcards', active: true },
    { icon: BarChart, label: 'Analytics', route: '/analytics' },
    { icon: User, label: 'Profile', route: '/profile' },
  ];

  const [decks] = useState<Deck[]>([
    {
      id: '1',
      name: 'Biology - Cell Structure',
      description: 'Key terms and concepts about cell biology',
      cards: [
        { id: '1', front: 'What is the powerhouse of the cell?', back: 'Mitochondria', mastered: false },
        { id: '2', front: 'What contains the genetic material in a cell?', back: 'Nucleus', mastered: true },
        { id: '3', front: 'What is the outer boundary of a cell?', back: 'Cell membrane', mastered: false },
        { id: '4', front: 'What organelle is responsible for protein synthesis?', back: 'Ribosomes', mastered: false },
        { id: '5', front: 'What is the jelly-like substance inside a cell?', back: 'Cytoplasm', mastered: true }
      ],
      lastStudied: new Date(Date.now() - 86400000),
      progress: 40
    },
    {
      id: '2',
      name: 'Spanish Vocabulary',
      description: 'Common Spanish words and phrases',
      cards: [
        { id: '1', front: 'Hello', back: 'Hola', mastered: true },
        { id: '2', front: 'Thank you', back: 'Gracias', mastered: true },
        { id: '3', front: 'Good morning', back: 'Buenos días', mastered: false },
        { id: '4', front: 'How are you?', back: '¿Cómo estás?', mastered: false }
      ],
      lastStudied: new Date(Date.now() - 172800000),
      progress: 50
    },
    {
      id: '3',
      name: 'Math Formulas',
      description: 'Important mathematical formulas',
      cards: [
        { id: '1', front: 'Area of a circle', back: 'πr²', mastered: false },
        { id: '2', front: 'Pythagorean theorem', back: 'a² + b² = c²', mastered: true },
        { id: '3', front: 'Quadratic formula', back: 'x = (-b ± √(b²-4ac)) / 2a', mastered: false }
      ],
      lastStudied: new Date(Date.now() - 259200000),
      progress: 33
    }
  ]);

  const nextCard = () => {
    if (selectedDeck && currentCardIndex < selectedDeck.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const resetDeck = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  const backToDecks = () => {
    setSelectedDeck(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (selectedDeck) {
    const currentCard = selectedDeck.cards[currentCardIndex];
    const progress = ((currentCardIndex + 1) / selectedDeck.cards.length) * 100;

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

        {/* Main Content - Card Study View */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card border-b border-border px-8 py-6 flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={backToDecks}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to Decks
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">{selectedDeck.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Card {currentCardIndex + 1} of {selectedDeck.cards.length}
                </p>
              </div>
            </div>
            <Avatar className="w-10 h-10 cursor-pointer" onClick={() => onNavigate('/profile')}>
              <AvatarFallback className="bg-accent text-accent-foreground">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </motion.header>

          {/* Content */}
          <main className="flex-1 flex flex-col items-center justify-center p-8">
            {/* Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-full max-w-2xl mb-8"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium text-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </motion.div>

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="w-full max-w-2xl h-96 mb-8"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentCard.id}-${isFlipped}`}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <Card 
                    className="w-full h-full p-8 border-2 border-border rounded-3xl cursor-pointer hover:border-accent transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <div className="text-center">
                      <p className="text-2xl text-foreground mb-4">
                        {isFlipped ? currentCard.back : currentCard.front}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isFlipped ? 'Answer' : 'Question'} • Click to flip
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex items-center space-x-4"
            >
              <Button
                onClick={prevCard}
                disabled={currentCardIndex === 0}
                variant="outline"
                size="lg"
                className="px-6 py-3 rounded-2xl border-2 hover:border-accent transition-all duration-300"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>

              <Button
                onClick={() => setIsFlipped(!isFlipped)}
                variant="outline"
                size="lg"
                className="px-6 py-3 rounded-2xl border-2 hover:border-accent transition-all duration-300"
              >
                {isFlipped ? <EyeOff className="w-5 h-5 mr-2" /> : <Eye className="w-5 h-5 mr-2" />}
                {isFlipped ? 'Hide' : 'Reveal'}
              </Button>

              <Button
                onClick={resetDeck}
                variant="outline"
                size="lg"
                className="px-6 py-3 rounded-2xl border-2 hover:border-accent transition-all duration-300"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>

              <Button
                onClick={nextCard}
                disabled={currentCardIndex === selectedDeck.cards.length - 1}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </main>
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

      {/* Main Content - Deck List */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card border-b border-border px-8 py-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
            <p className="text-muted-foreground">Practice and memorize with spaced repetition</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl" disabled>
              <Plus className="w-4 h-4 mr-2" />
              Create Deck
              <Badge className="ml-2 bg-muted text-muted-foreground">Coming Soon</Badge>
            </Button>
            <Avatar className="w-10 h-10 cursor-pointer" onClick={() => onNavigate('/profile')}>
              <AvatarFallback className="bg-accent text-accent-foreground">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.header>

        {/* Content */}
        <main className="flex-1 p-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck, index) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                onClick={() => setSelectedDeck(deck)}
              >
                <Card className="p-6 h-full cursor-pointer border-2 border-border hover:border-accent transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {deck.cards.length} cards
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">{deck.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{deck.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs font-medium text-foreground">{deck.progress}%</span>
                      </div>
                      <Progress value={deck.progress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Last studied: {formatDate(deck.lastStudied)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {deck.cards.filter(card => card.mastered).length} mastered
                      </Badge>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}