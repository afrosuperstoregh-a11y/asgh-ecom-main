# OAuth Setup Guide for Vercel Deployment

## Google OAuth Setup

### 1. Create Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API and Google OAuth2 API

### 2. Create OAuth Credentials
1. Go to APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Select "Web application"
4. Add authorized redirect URI:
   ```
   https://your-domain.vercel.app/api/auth/google/callback
   ```
5. Copy Client ID and Client Secret

## Facebook OAuth Setup

### 1. Create Facebook App
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create new app → Business
3. Add Facebook Login product

### 2. Configure OAuth
1. Go to Settings → Basic
2. Add App Domains: `your-domain.vercel.app`
3. Add redirect URI:
   ```
   https://your-domain.vercel.app/api/auth/facebook/callback
   ```
4. Copy App ID and App Secret

## Environment Variables
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Public variables (safe to expose)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
```

## Important Notes
- Use HTTPS URLs for production
- Test in development first with localhost URLs
- Update redirect URIs when changing domains
