# 🚀 Just Better Study - Quick Setup Guide

## ❌ Current Errors & Solutions

### Error: "Could not find the table 'public.users' in the schema cache"
**Solution:** Your database tables haven't been created yet. Follow Step 1 below.

### Error: "Invalid login credentials"
**Solution:** Either the account doesn't exist, or the password is wrong. Try signing up first.

### Error: "Email not confirmed"
**Solution:** Check your email for a confirmation link and click it before signing in.

---

## 📋 Setup Steps (5 minutes)

### Step 1: Create Database Tables ⭐ **REQUIRED**

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard
   - Open your project: `cakzfgkuzeblnbvhujkv`

2. **Run the Database Schema:**
   - Click **SQL Editor** in the left sidebar
   - Copy the **entire contents** of `/database-schema.sql`
   - Paste it into the SQL Editor
   - Click **▶ Run** button
   - ✅ You should see "Success" messages for table creation

### Step 2: Test Your Setup

1. **Try the app again** - the setup page should now show green checkmarks
2. **Create a test account** using email/password
3. **Verify everything works** by creating a study session

---

## 🔧 Optional Configurations

### Enable Google Sign-In (Optional)
1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Google**
3. Follow: https://supabase.com/docs/guides/auth/social-login/auth-google

### Enable Apple Sign-In (Optional)
1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Apple**
3. Follow: https://supabase.com/docs/guides/auth/social-login/auth-apple

---

## 🎯 What the Database Schema Creates

- **users** - User profiles and preferences
- **sessions** - Pomodoro study sessions
- **todos** - Task management
- **analytics** - Study progress tracking
- **Security policies** - Row-level security
- **Triggers** - Automatic data updates

---

## 🐛 Troubleshooting

### Still seeing "table not found" errors?
- Make sure you copied the **entire** SQL schema
- Check that all tables were created in the **Table Editor**
- Try refreshing the app

### Email confirmation not working?
- Check your spam folder
- Make sure the email address is correct
- Try signing up with a different email

### Authentication errors?
- Clear your browser cache and cookies
- Try incognito/private browsing mode
- Check that your Supabase URL and keys are correct

---

## ✅ Success Checklist

- [ ] Database schema executed successfully
- [ ] All 4 tables visible in Supabase Table Editor
- [ ] Setup page shows green checkmarks
- [ ] Can create new account with email/password
- [ ] Can sign in and access dashboard
- [ ] Study sessions and todos work properly

---

**🎉 That's it! Your Just Better Study platform is ready to use!**

Need more help? Check the detailed `SETUP-DATABASE.md` file or the in-app setup checker.