# Redis Setup Guide for Vercel Deployment

## Option 1: Upstash Redis (Recommended for Vercel)
1. Go to [upstash.com](https://upstash.com)
2. Create free account
3. Create new Redis database
4. Choose region closest to your Vercel deployment
5. Copy REST URL and connection string

## Option 2: Vercel KV (Alternative)
1. Go to Vercel Dashboard → Storage → Create Database
2. Select KV (Redis-compatible)
3. Create database
4. Copy connection string

## Connection String Format
```
redis://username:password@host:port
```

## Uses in Application
- Session management
- API rate limiting
- Caching frequently accessed data
- Shopping cart storage
