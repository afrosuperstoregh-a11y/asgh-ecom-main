# Database Setup Guide for Vercel Deployment

## Option 1: Vercel Postgres (Recommended)
1. Go to Vercel Dashboard → Storage → Create Database
2. Select PostgreSQL
3. Choose region closest to your users
4. Create database
5. Copy connection string to your `.env.production`

## Option 2: Supabase (Alternative)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string

## Option 3: Railway (Alternative)
1. Go to [railway.app](https://railway.app)
2. Create new PostgreSQL service
3. Get connection string from service settings

## Connection String Format
```
postgresql://user:password@host:port/database?sslmode=require
```

## Required Tables
The application will auto-create tables on first run. Ensure the database user has CREATE TABLE permissions.
