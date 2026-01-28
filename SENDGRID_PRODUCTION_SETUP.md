# SendGrid Production Setup Guide

## Overview
This guide ensures email receipts work in production for Afro Superstore.

## Prerequisites
- SendGrid account (https://sendgrid.com)
- Verified domain (afrosuperstore.ca)
- Production environment access

## Step 1: SendGrid Account Setup

### 1.1 Create SendGrid Account
1. Sign up at https://sendgrid.com
2. Choose a plan (Free tier allows 100 emails/day)
3. Complete account verification

### 1.2 Domain Verification
1. Go to Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Add `afrosuperstore.ca`
4. Add DNS records:
   ```
   TXT: "v=spf1 include:sendgrid.net ~all"
   TXT: "SendGrid verification code"
   CNAME: "em1234.afrosuperstore.ca" → "sendgrid.net"
   ```

### 1.3 Create API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Select "Restricted Access"
4. Grant permissions:
   - Mail Send: Full Access
   - Template Engine: Read Access
5. Copy the API key securely

## Step 2: Environment Configuration

### 2.1 Vercel Environment Variables
Add these to your Vercel project settings:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyy
SENDGRID_FROM_EMAIL=noreply@afrosuperstore.ca
SENDGRID_FROM_NAME=Afro Superstore

# Email Settings
EMAIL_ENABLED=true
EMAIL_FROM=noreply@afrosuperstore.ca
EMAIL_REPLY_TO=support@afrosuperstore.ca
```

### 2.2 Railway Environment Variables
Add these to your Railway backend:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyy
SENDGRID_FROM_EMAIL=noreply@afrosuperstore.ca
SENDGRID_FROM_NAME=Afro Superstore
```

## Step 3: Production Deployment

### 3.1 Install Dependencies
```bash
cd ecommerce-platform/frontend
npm install @sendgrid/mail
```

### 3.2 Build and Deploy
```bash
npm run build
vercel --prod
```

### 3.3 Verify Email Configuration
1. Check Vercel Function Logs
2. Test email sending via API
3. Monitor SendGrid dashboard

## Step 4: Email Template Testing

### 4.1 Test Email Receipt
1. Complete a test purchase
2. Check email receipt arrives
3. Verify email content and formatting

### 4.2 Email Content Verification
Ensure email includes:
- ✅ Order number and date
- ✅ Customer information
- ✅ Complete item list with images
- ✅ Price breakdown
- ✅ Shipping address
- ✅ Payment details (masked)
- ✅ Afro Superstore branding

## Step 5: Monitoring and Troubleshooting

### 5.1 SendGrid Dashboard
Monitor:
- Email delivery rates
- Open rates
- Click rates
- Bounce rates
- Spam reports

### 5.2 Common Issues

#### Issue: Emails not sending
**Solution:**
1. Check SENDGRID_API_KEY is set correctly
2. Verify domain authentication
3. Check API key permissions
4. Review Vercel function logs

#### Issue: Emails going to spam
**Solution:**
1. Verify SPF/DKIM records
2. Check email content for spam triggers
3. Monitor sender reputation
4. Use double opt-in for marketing emails

#### Issue: Email formatting broken
**Solution:**
1. Test HTML email in multiple clients
2. Use inline CSS styles
3. Avoid complex JavaScript
4. Test mobile responsiveness

## Step 6: Security Considerations

### 6.1 API Key Security
- Never commit API keys to git
- Use environment variables
- Rotate keys regularly
- Monitor API usage

### 6.2 Email Security
- Use verified sender domains
- Implement SPF/DKIM/DMARC
- Monitor for phishing attempts
- Use TLS for email transmission

## Step 7: Performance Optimization

### 7.1 Email Sending Best Practices
- Batch email sends when possible
- Use SendGrid templates for consistency
- Implement retry logic for failed sends
- Monitor rate limits

### 7.2 Template Optimization
- Keep email size under 100KB
- Optimize images for email
- Use alt text for images
- Test loading times

## Step 8: Compliance

### 8.1 CAN-SPAM Compliance
- Include physical address
- Provide unsubscribe option
- Use accurate subject lines
- Honor unsubscribe requests

### 8.2 GDPR Compliance
- Get consent for marketing emails
- Provide data deletion options
- Include privacy policy link
- Document data processing

## Testing Checklist

- [ ] SendGrid account created and verified
- [ ] Domain authenticated with DNS records
- [ ] API key generated and configured
- [ ] Environment variables set in Vercel
- [ ] Package dependencies installed
- [ ] Test purchase completed
- [ ] Email receipt received
- [ ] Email content verified
- [ ] Mobile responsiveness tested
- [ ] Spam folder checked
- [ ] SendGrid dashboard monitored
- [ ] Error logging verified

## Emergency Contacts

- **SendGrid Support**: https://support.sendgrid.com
- **Vercel Support**: https://vercel.com/support
- **Domain Provider**: For DNS changes
- **Email Administrator**: For domain issues

## Next Steps

1. Complete SendGrid setup
2. Configure environment variables
3. Deploy to production
4. Test email functionality
5. Monitor and optimize

This setup ensures customers receive professional email receipts immediately after successful payment in production.
