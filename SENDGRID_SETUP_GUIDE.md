# SendGrid Setup Guide for Vercel Deployment

## 1. Create SendGrid Account
1. Go to [sendgrid.com](https://sendgrid.com)
2. Create free account
3. Complete sender verification

## 2. Verify Sender Identity
1. Go to Settings → Sender Authentication
2. Verify your domain or single sender
3. Complete DNS verification if using domain

## 3. Create API Key
1. Go to Settings → API Keys
2. Create new API key
3. Select permissions:
   - Mail Send: Full Access
   - Template Engine: Read Access (optional)
4. Copy the API key

## 4. Update Environment Variables
```bash
SENDGRID_API_KEY=SG.your_api_key_here
FROM_EMAIL=noreply@your-domain.com
FROM_NAME=Your Store Name
```

## 5. Test Email Configuration
- Send a test email through SendGrid dashboard
- Verify delivery and SPF/DKIM records
