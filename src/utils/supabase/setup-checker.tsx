import { supabase } from './client';

export interface SetupStatus {
  tablesExist: boolean;
  authEnabled: boolean;
  canConnect: boolean;
  errors: string[];
}

export const checkDatabaseSetup = async (): Promise<SetupStatus> => {
  const status: SetupStatus = {
    tablesExist: false,
    authEnabled: false,
    canConnect: false,
    errors: []
  };

  try {
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (!error) {
      status.canConnect = true;
      status.tablesExist = true;
    } else if (error.code === 'PGRST205') {
      status.canConnect = true;
      status.tablesExist = false;
      status.errors.push('Database tables not found. Please run the database schema setup.');
    } else {
      status.errors.push(`Database connection error: ${error.message}`);
    }
  } catch (error: any) {
    status.errors.push(`Failed to check database: ${error.message}`);
  }

  try {
    // Test auth configuration
    const { data: session } = await supabase.auth.getSession();
    status.authEnabled = true;
  } catch (error: any) {
    status.errors.push(`Auth configuration error: ${error.message}`);
  }

  return status;
};

export const getSetupInstructions = (status: SetupStatus): string[] => {
  const instructions: string[] = [];

  if (!status.canConnect) {
    instructions.push('🔴 Cannot connect to Supabase. Check your URL and API keys.');
  }

  if (!status.tablesExist) {
    instructions.push('🔴 Database tables missing. Run the SQL schema from /database-schema.sql in your Supabase SQL Editor.');
    instructions.push('📋 Go to: Supabase Dashboard → Your Project → SQL Editor → Paste schema → Run');
  }

  if (!status.authEnabled) {
    instructions.push('🔴 Authentication not properly configured.');
  }

  if (status.tablesExist && status.authEnabled && status.canConnect) {
    instructions.push('✅ Database setup complete!');
  }

  return instructions;
}; 