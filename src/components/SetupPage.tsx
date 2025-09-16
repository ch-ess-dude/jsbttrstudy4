import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { BookOpen, Database, AlertCircle, CheckCircle, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { checkDatabaseSetup, getSetupInstructions, SetupStatus } from '../utils/supabase/setup-checker';
import { projectId } from '../utils/supabase/info';

interface SetupPageProps {
  onNavigate: (route: string) => void;
  onRetry: () => void;
}

export function SetupPage({ onNavigate, onRetry }: SetupPageProps) {
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    setChecking(true);
    try {
      const status = await checkDatabaseSetup();
      setSetupStatus(status);
    } catch (error) {
      console.error('Setup check failed:', error);
      setSetupStatus({
        tablesExist: false,
        authEnabled: false,
        canConnect: false,
        errors: ['Failed to check setup status']
      });
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const handleRetrySetup = async () => {
    await checkSetup();
    if (setupStatus?.tablesExist && setupStatus?.canConnect) {
      onRetry();
    }
  };

  const copySchemaToClipboard = () => {
    // This would copy the database schema - for now just show instructions
    navigator.clipboard.writeText('-- Please copy the schema from /database-schema.sql file');
  };

  const openSupabaseDashboard = () => {
    window.open(`https://supabase.com/dashboard/project/${projectId}/sql`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Database className="w-5 h-5 text-accent-foreground" />
          </div>
          <p className="text-muted-foreground">Checking database setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h1 className="text-xl font-semibold text-foreground mb-2">Database Setup Required</h1>
            <p className="text-muted-foreground">
              Your database needs to be configured before you can use Just Better Study
            </p>
          </motion.div>
        </div>

        <Card className="p-8 border-0 shadow-xl rounded-3xl bg-card">
          {/* Status Overview */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Setup Status</h2>
              <Button
                onClick={checkSetup}
                disabled={checking}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                {checking ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Check Again
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {setupStatus?.canConnect ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
                <span className="text-foreground">Supabase Connection</span>
              </div>
              
              <div className="flex items-center space-x-3">
                {setupStatus?.tablesExist ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
                <span className="text-foreground">Database Tables</span>
              </div>
              
              <div className="flex items-center space-x-3">
                {setupStatus?.authEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
                <span className="text-foreground">Authentication</span>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Setup Instructions */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Setup Instructions</h3>
            
            {setupStatus && getSetupInstructions(setupStatus).map((instruction, index) => (
              <Alert key={index} className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  {instruction}
                </AlertDescription>
              </Alert>
            ))}

            {!setupStatus?.tablesExist && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-xl">
                  <h4 className="font-semibold text-foreground mb-2">Quick Setup Steps:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Open your <strong>Supabase Dashboard</strong></li>
                    <li>Go to <strong>SQL Editor</strong> in the left sidebar</li>
                    <li>Copy the contents of <code>/database-schema.sql</code></li>
                    <li>Paste it into the SQL Editor</li>
                    <li>Click <strong>Run</strong> to execute the schema</li>
                    <li>Come back here and click "Retry Setup"</li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={openSupabaseDashboard}
                    variant="outline"
                    className="flex-1 rounded-xl"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Supabase Dashboard
                  </Button>
                  <Button
                    onClick={() => onNavigate('/')}
                    variant="ghost"
                    className="flex-1 rounded-xl"
                  >
                    View Schema File
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRetrySetup}
              disabled={checking}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Retry Setup'
              )}
            </Button>
            
            <Button
              onClick={() => onNavigate('/')}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              Back to Home
            </Button>
          </div>

          {/* Errors Display */}
          {setupStatus?.errors && setupStatus.errors.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-destructive mb-2">Errors:</h4>
              <div className="space-y-2">
                {setupStatus.errors.map((error, index) => (
                  <Alert key={index} variant="destructive" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      {error}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Need help? Check the <code>SETUP-DATABASE.md</code> file for detailed instructions.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}