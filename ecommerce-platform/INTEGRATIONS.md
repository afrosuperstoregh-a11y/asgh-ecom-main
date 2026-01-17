# External Service Integrations - Authentication & User Accounts

## SendGrid Email Service Integration

### Setup Instructions

1. **Create SendGrid Account**
   - Sign up at https://signup.sendgrid.com
   - Verify your email address
   - Complete sender verification

2. **Generate API Key**
   - Go to Settings > API Keys
   - Create new API key with "Mail Send" permissions
   - Copy the API key to your environment variables

3. **Domain Authentication**
   - Set up domain authentication for better deliverability
   - Add DNS records (TXT, CNAME, MX) to your domain
   - Verify domain ownership

### Environment Variables
```bash
SENDGRID_API_KEY=SG.your-api-key-here
FROM_EMAIL=noreply@yourcompany.com
FROM_NAME=Your Company
```

### Email Templates

#### Welcome Email Template
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Your Company</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Your Company!</h1>
        <p>Hi {{name}},</p>
        <p>Thank you for creating an account with us. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{verification_url}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p>{{verification_url}}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The Your Company Team</p>
    </div>
</body>
</html>
```

#### Password Reset Template
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset - Your Company</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reset Your Password</h1>
        <p>Hi {{name}},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{reset_url}}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </div>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The Your Company Team</p>
    </div>
</body>
</html>
```

### Implementation Code

#### Email Service Class
```javascript
// services/emailService.js
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.fromEmail = process.env.FROM_EMAIL;
    this.fromName = process.env.FROM_NAME;
  }

  async sendWelcomeEmail(user, verificationToken) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;
    
    const msg = {
      to: user.email,
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject: 'Welcome to Your Company - Please Verify Your Email',
      html: this.getWelcomeTemplate(user.name, verificationUrl)
    };

    try {
      await sgMail.send(msg);
      console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
    
    const msg = {
      to: user.email,
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject: 'Reset Your Password - Your Company',
      html: this.getPasswordResetTemplate(user.name, resetUrl)
    };

    try {
      await sgMail.send(msg);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  getWelcomeTemplate(name, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Welcome to Your Company</title>
      </head>
      <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Welcome to Your Company!</h1>
              <p>Hi ${name || 'there'},</p>
              <p>Thank you for creating an account with us. Please click the button below to verify your email address:</p>
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Verify Email</a>
              </div>
              <p>This link will expire in 24 hours.</p>
              <p>Best regards,<br>The Your Company Team</p>
          </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(name, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Password Reset - Your Company</title>
      </head>
      <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Reset Your Password</h1>
              <p>Hi ${name || 'there'},</p>
              <p>We received a request to reset your password. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Reset Password</a>
              </div>
              <p>If you didn't request this password reset, you can safely ignore this email.</p>
              <p>This link will expire in 1 hour.</p>
              <p>Best regards,<br>The Your Company Team</p>
          </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
```

---

## Twilio SMS Service Integration

### Setup Instructions

1. **Create Twilio Account**
   - Sign up at https://www.twilio.com/try-twilio
   - Verify your phone number
   - Get a Twilio phone number

2. **Get Account Credentials**
   - Go to Console > Settings > General
   - Copy Account SID and Auth Token
   - Note your Twilio phone number

### Environment Variables
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Implementation Code

#### SMS Service Class
```javascript
// services/smsService.js
const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async sendVerificationSMS(phoneNumber, code) {
    const message = await this.client.messages.create({
      body: `Your verification code is: ${code}. It will expire in 10 minutes.`,
      from: this.fromNumber,
      to: phoneNumber
    });

    console.log(`SMS sent to ${phoneNumber}: ${message.sid}`);
    return message;
  }

  async sendPasswordResetSMS(phoneNumber, resetToken) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-phone?token=${resetToken}`;
    
    const message = await this.client.messages.create({
      body: `Reset your password: ${resetUrl}. This link will expire in 1 hour.`,
      from: this.fromNumber,
      to: phoneNumber
    });

    console.log(`Password reset SMS sent to ${phoneNumber}: ${message.sid}`);
    return message;
  }

  async sendLoginAlertSMS(phoneNumber, deviceInfo) {
    const message = await this.client.messages.create({
      body: `New login detected from ${deviceInfo.device} (${deviceInfo.location}). If this wasn't you, please secure your account immediately.`,
      from: this.fromNumber,
      to: phoneNumber
    });

    console.log(`Login alert SMS sent to ${phoneNumber}: ${message.sid}`);
    return message;
  }
}

module.exports = new SMSService();
```

---

## Google OAuth Integration

### Setup Instructions

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create new project or select existing one
   - Enable Google+ API and Google People API

2. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services > Credentials
   - Create Credentials > OAuth 2.0 Client ID
   - Select "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:3001/api/auth/google/callback`
     - Production: `https://your-api-domain.com/api/auth/google/callback`

3. **Configure Consent Screen**
   - Go to APIs & Services > OAuth consent screen
   - Fill in required fields
   - Add required scopes: email, profile, openid

### Environment Variables
```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

### Implementation Code

#### Google OAuth Service
```javascript
// services/googleAuthService.js
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class GoogleAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getUserInfo(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      return {
        id: userInfo.data.id,
        email: userInfo.data.email,
        name: userInfo.data.name,
        picture: userInfo.data.picture,
        verified_email: userInfo.data.verified_email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token
      };
    } catch (error) {
      console.error('Error getting Google user info:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  async verifyToken(token) {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        verified_email: payload.email_verified
      };
    } catch (error) {
      console.error('Error verifying Google token:', error);
      throw new Error('Invalid Google token');
    }
  }
}

module.exports = new GoogleAuthService();
```

---

## Facebook OAuth Integration

### Setup Instructions

1. **Create Facebook App**
   - Go to https://developers.facebook.com/apps
   - Create new app > "Business"
   - Add "Facebook Login" product

2. **Configure OAuth Settings**
   - Set valid OAuth redirect URIs:
     - Development: `http://localhost:3001/api/auth/facebook/callback`
     - Production: `https://your-api-domain.com/api/auth/facebook/callback`

3. **Get App Credentials**
   - Go to Settings > Basic
   - Copy App ID and App Secret

### Environment Variables
```bash
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3001/api/auth/facebook/callback
```

### Implementation Code

#### Facebook OAuth Service
```javascript
// services/facebookAuthService.js
const axios = require('axios');

class FacebookAuthService {
  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID;
    this.appSecret = process.env.FACEBOOK_APP_SECRET;
    this.redirectUri = process.env.FACEBOOK_REDIRECT_URI;
  }

  getAuthUrl() {
    const scopes = ['email', 'public_profile'];
    return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${this.appId}&redirect_uri=${this.redirectUri}&scope=${scopes.join(',')}`;
  }

  async getUserInfo(code) {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: this.redirectUri,
          code: code
        }
      });

      const accessToken = tokenResponse.data.access_token;

      // Get user info
      const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
        params: {
          fields: 'id,name,email,picture',
          access_token: accessToken
        }
      });

      return {
        id: userResponse.data.id,
        email: userResponse.data.email,
        name: userResponse.data.name,
        picture: userResponse.data.picture?.data?.url,
        accessToken: accessToken
      };
    } catch (error) {
      console.error('Error getting Facebook user info:', error);
      throw new Error('Failed to authenticate with Facebook');
    }
  }

  async verifyToken(token) {
    try {
      const response = await axios.get('https://graph.facebook.com/debug_token', {
        params: {
          input_token: token,
          access_token: `${this.appId}|${this.appSecret}`
        }
      });

      if (!response.data.data.is_valid) {
        throw new Error('Invalid Facebook token');
      }

      const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
        params: {
          fields: 'id,name,email,picture',
          access_token: token
        }
      });

      return {
        id: userResponse.data.id,
        email: userResponse.data.email,
        name: userResponse.data.name,
        picture: userResponse.data.picture?.data?.url
      };
    } catch (error) {
      console.error('Error verifying Facebook token:', error);
      throw new Error('Invalid Facebook token');
    }
  }
}

module.exports = new FacebookAuthService();
```

---

## Apple Sign In Integration

### Setup Instructions

1. **Create Apple Developer Account**
   - Go to https://developer.apple.com
   - Create new App ID with "Sign In with Apple" capability
   - Create Service ID for web integration

2. **Generate Private Key**
   - Go to Certificates, Identifiers & Profiles > Keys
   - Create new key with "Sign In with Apple" capability
   - Download the .p8 file (only available once)

3. **Configure Web Integration**
   - Add your domain and return URLs to Service ID
   - Return URL: `https://your-api-domain.com/api/auth/apple/callback`

### Environment Variables
```bash
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
APPLE_KEY_ID=your-apple-key-id
APPLE_TEAM_ID=your-apple-team-id
```

### Implementation Code

#### Apple Auth Service
```javascript
// services/appleAuthService.js
const jwt = require('jsonwebtoken');
const axios = require('axios');

class AppleAuthService {
  constructor() {
    this.clientId = process.env.APPLE_CLIENT_ID;
    this.keyId = process.env.APPLE_KEY_ID;
    this.teamId = process.env.APPLE_TEAM_ID;
    this.privateKey = process.env.APPLE_PRIVATE_KEY;
  }

  generateClientSecret() {
    const now = Math.floor(Date.now() / 1000);
    const expiration = now + 15777000; // 6 months

    return jwt.sign(
      {
        iss: this.teamId,
        iat: now,
        exp: expiration,
        aud: 'https://appleid.apple.com',
        sub: this.clientId
      },
      this.privateKey,
      {
        algorithm: 'ES256',
        header: {
          kid: this.keyId,
          alg: 'ES256'
        }
      }
    );
  }

  async getUserInfo(code) {
    try {
      const clientSecret = this.generateClientSecret();

      const response = await axios.post('https://appleid.apple.com/auth/token', {
        client_id: this.clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code'
      });

      const idToken = response.data.id_token;
      const decoded = jwt.decode(idToken);

      return {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name ? `${decoded.name.firstName} ${decoded.name.lastName}` : null,
        idToken: idToken,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token
      };
    } catch (error) {
      console.error('Error getting Apple user info:', error);
      throw new Error('Failed to authenticate with Apple');
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.decode(token);
      
      // Verify token with Apple's public keys
      const response = await axios.get('https://appleid.apple.com/auth/keys');
      const publicKey = response.data.keys.find(key => key.kid === decoded.header.kid);

      if (!publicKey) {
        throw new Error('Invalid Apple token');
      }

      const verified = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        audience: this.clientId,
        issuer: 'https://appleid.apple.com'
      });

      return {
        id: verified.sub,
        email: verified.email
      };
    } catch (error) {
      console.error('Error verifying Apple token:', error);
      throw new Error('Invalid Apple token');
    }
  }
}

module.exports = new AppleAuthService();
```

---

## Integration Testing

### Test Environment Setup

1. **Development Tools**
   - Use MailHog for email testing in development
   - Use ngrok for OAuth callback testing
   - Use test OAuth credentials

2. **Test Scenarios**
   - Email verification flow
   - Password reset flow
   - Social login flows
   - Error handling scenarios

### Monitoring and Logging

1. **Email Metrics**
   - Delivery rates
   - Open rates
   - Click rates
   - Bounce handling

2. **SMS Metrics**
   - Delivery status
   - Cost tracking
   - Rate limiting

3. **OAuth Metrics**
   - Login success rates
   - Error rates
   - Performance metrics

---

## Security Considerations

### Email Security
- Use DKIM, SPF, and DMARC records
- Implement email verification
- Rate limit email sending
- Monitor for abuse

### SMS Security
- Implement rate limiting
- Use secure codes
- Log all SMS activities
- Monitor for fraud

### OAuth Security
- Validate state parameter
- Use HTTPS only
- Implement PKCE for mobile apps
- Regular token refresh

### Data Protection
- Encrypt sensitive data
- Implement data retention policies
- Follow GDPR requirements
- Regular security audits

---

## Troubleshooting

### Common Issues

1. **Email Not Delivered**
   - Check DNS records
   - Verify sender reputation
   - Check spam filters
   - Review SendGrid logs

2. **OAuth Callback Failures**
   - Verify redirect URIs
   - Check CORS settings
   - Review OAuth configuration
   - Check network connectivity

3. **SMS Delivery Issues**
   - Verify phone number format
   - Check Twilio logs
   - Review carrier restrictions
   - Monitor rate limits

### Debugging Tools

1. **SendGrid**
   - Email Activity Feed
   - Event Webhooks
   - Suppression Management

2. **Twilio**
   - Message Logs
   - Debugger
   - Console Monitoring

3. **OAuth Providers**
   - Developer Console
   - API Explorer
   - Error Documentation
