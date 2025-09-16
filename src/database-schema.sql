-- ===============================================
-- Just Better Study - PostgreSQL Database Schema
-- ===============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    auth_provider TEXT NOT NULL CHECK (auth_provider IN ('email', 'google', 'apple')),
    preferences JSONB NOT NULL DEFAULT '{
        "darkMode": false,
        "notifications": true,
        "defaultPomodoroTime": 25,
        "defaultShortBreak": 5,
        "defaultLongBreak": 15,
        "studyGoal": 20
    }',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table for Pomodoro sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    duration INTEGER NOT NULL CHECK (duration >= 0), -- in minutes
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_sessions INTEGER NOT NULL DEFAULT 0 CHECK (total_sessions >= 0),
    total_study_time INTEGER NOT NULL DEFAULT 0 CHECK (total_study_time >= 0), -- in minutes
    total_completed_tasks INTEGER NOT NULL DEFAULT 0 CHECK (total_completed_tasks >= 0),
    subjects_breakdown JSONB NOT NULL DEFAULT '{}', -- subject -> minutes mapping
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_subject ON sessions(user_id, subject);

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist, then create new ones
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
DROP TRIGGER IF EXISTS update_analytics_updated_at ON analytics;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;

-- Sessions table policies
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own todos" ON todos;
DROP POLICY IF EXISTS "Users can insert own todos" ON todos;
DROP POLICY IF EXISTS "Users can update own todos" ON todos;
DROP POLICY IF EXISTS "Users can delete own todos" ON todos;

-- Todos table policies
CREATE POLICY "Users can view own todos" ON todos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todos" ON todos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos" ON todos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos" ON todos
    FOR DELETE USING (auth.uid() = user_id);

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own analytics" ON analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics;
DROP POLICY IF EXISTS "Users can update own analytics" ON analytics;

-- Analytics table policies
CREATE POLICY "Users can view own analytics" ON analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- ===============================================
-- FUNCTIONS AND TRIGGERS FOR AUTOMATIC UPDATES
-- ===============================================

-- Function to automatically update todos.completed_at when status changes to completed
CREATE OR REPLACE FUNCTION update_todo_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS trigger_update_todo_completed_at ON todos;

CREATE TRIGGER trigger_update_todo_completed_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_todo_completed_at();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, auth_provider, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'auth_provider', 
            CASE 
                WHEN NEW.raw_user_meta_data->>'provider' = 'google' THEN 'google'
                WHEN NEW.raw_user_meta_data->>'provider' = 'apple' THEN 'apple'
                ELSE 'email'
            END
        ),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Initialize analytics for new user
    INSERT INTO analytics (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ===============================================
-- UTILITY FUNCTIONS
-- ===============================================

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    total_study_time BIGINT,
    total_todos BIGINT,
    completed_todos BIGINT,
    pending_todos BIGINT,
    subjects_count BIGINT,
    avg_session_duration NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.session_count, 0) as total_sessions,
        COALESCE(s.total_duration, 0) as total_study_time,
        COALESCE(t.total_count, 0) as total_todos,
        COALESCE(t.completed_count, 0) as completed_todos,
        COALESCE(t.pending_count, 0) as pending_todos,
        COALESCE(s.subject_count, 0) as subjects_count,
        COALESCE(s.avg_duration, 0) as avg_session_duration
    FROM 
        (SELECT user_uuid as id) u
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) as session_count,
            SUM(duration) as total_duration,
            COUNT(DISTINCT subject) as subject_count,
            AVG(duration) as avg_duration
        FROM sessions 
        WHERE user_id = user_uuid AND end_time IS NOT NULL
        GROUP BY user_id
    ) s ON s.user_id = u.id
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_count
        FROM todos 
        WHERE user_id = user_uuid
        GROUP BY user_id
    ) t ON t.user_id = u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- INITIAL DATA AND CLEANUP
-- ===============================================

-- Clean up any existing data that might conflict
-- (Only run this if you're starting fresh)
-- DELETE FROM analytics;
-- DELETE FROM todos;
-- DELETE FROM sessions;
-- DELETE FROM users;

COMMIT;