# Database Setup Guide - Just Better Study

## 🚀 Complete PostgreSQL Database Setup

### Step 1: Execute Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: `cakzfgkuzeblnbvhujkv`
3. Go to **SQL Editor** in the left sidebar
4. Copy and paste the entire contents of `/database-schema.sql`
5. Click **Run** to execute the schema

This will create:
- ✅ All required tables (`users`, `sessions`, `todos`, `analytics`)
- ✅ Proper indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Automatic triggers for data updates
- ✅ User registration automation

### Step 2: Verify Tables Were Created

In the **Table Editor**:
- `users` - User profiles and preferences
- `sessions` - Pomodoro study sessions  
- `todos` - Task management
- `analytics` - User statistics and progress

### Step 3: Enable Real-time (if not already enabled)

1. Go to **Database** → **Replication**
2. Enable replication for all tables:
   - `users`
   - `sessions` 
   - `todos`
   - `analytics`

### Step 4: Configure Authentication Providers

#### Google OAuth Setup:
1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Follow: https://supabase.com/docs/guides/auth/social-login/auth-google
4. Add your Google Client ID and Secret

#### Apple OAuth Setup:
1. Go to **Authentication** → **Providers**  
2. Enable **Apple**
3. Follow: https://supabase.com/docs/guides/auth/social-login/auth-apple
4. Add your Apple Client ID and Secret

### Step 5: Test the System

1. Try creating a new account via email/password
2. Test Google OAuth sign-in (if configured)
3. Test Apple OAuth sign-in (if configured)
4. Verify user profile creation in the `users` table
5. Test creating study sessions and todos
6. Check that analytics update automatically

## 🔒 Security Features Implemented

- **Row Level Security (RLS)** - Users can only access their own data
- **Input Validation** - Email format, password strength requirements
- **SQL Injection Protection** - Parameterized queries via Supabase client
- **Authentication Required** - All API endpoints require valid auth tokens
- **Automatic User Creation** - No pre-registration needed

## 📊 Real-time Features

- **Profile Updates** - Changes sync across all devices
- **Study Sessions** - New sessions appear immediately in analytics  
- **Todo Updates** - Task completion updates analytics in real-time
- **Analytics Refresh** - Statistics update automatically after each session

## 🗃️ Database Schema Summary

### Users Table
```sql
- id (UUID, FK to auth.users)
- email (TEXT, unique)
- full_name (TEXT)
- avatar_url (TEXT, optional)
- auth_provider (email|google|apple)
- preferences (JSONB)
- created_at, updated_at
```

### Sessions Table  
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- session_name (TEXT)
- subject (TEXT)
- duration (INTEGER, minutes)
- start_time, end_time (TIMESTAMPTZ)
```

### Todos Table
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- title (TEXT)
- description (TEXT, optional)
- status (pending|completed)
- created_at, completed_at
```

### Analytics Table
```sql
- id (UUID, PK)
- user_id (UUID, FK, unique)
- total_sessions (INTEGER)
- total_study_time (INTEGER, minutes)
- total_completed_tasks (INTEGER)
- subjects_breakdown (JSONB)
```

## 🚨 Troubleshooting

### "Table doesn't exist" errors:
- Ensure you ran the complete SQL schema from `/database-schema.sql`
- Check that RLS policies were created

### Authentication errors:
- Verify Supabase URL and keys are correct in `/utils/supabase/info.tsx`
- Ensure OAuth providers are properly configured

### Real-time not working:
- Enable replication for all tables in Database → Replication
- Check browser console for WebSocket connection errors

### Permission denied errors:
- Verify RLS policies are active
- Check that users are properly authenticated

## 🎯 Production Checklist

- [ ] Database schema executed successfully
- [ ] RLS policies active on all tables  
- [ ] OAuth providers configured (Google/Apple)
- [ ] Real-time replication enabled
- [ ] Test user registration flow
- [ ] Test study session creation
- [ ] Test todo management
- [ ] Verify analytics updates
- [ ] Test cross-device sync

Your PostgreSQL-powered Just Better Study platform is now ready for production! 🎉