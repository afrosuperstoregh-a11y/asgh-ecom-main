const session = require('express-session');

const sessionConfig = {
  name: 'asca_session',
  secret: process.env.SESSION_SECRET || 'asca-ecommerce-super-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    domain: process.env.SESSION_DOMAIN || undefined,
  },
  // Use memory store for development to avoid Redis issues
  store: undefined,
};

// Development session configuration adjustments
if (process.env.NODE_ENV !== 'production') {
  sessionConfig.cookie.secure = false;
  sessionConfig.cookie.sameSite = 'lax';
}

// Session middleware factory
const createSessionMiddleware = () => {
  return session(sessionConfig);
};

// Session helper functions
const sessionHelpers = {
  // Get session data from Redis directly
  async getSession(sessionId) {
    try {
      const client = redis();
      if (!client) return null;
      
      const sessionData = await client.get(`sess:${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Destroy session
  async destroySession(sessionId) {
    try {
      const client = redis();
      if (!client) return false;
      
      await client.del(`sess:${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error destroying session:', error);
      return false;
    }
  },

  // Update session data
  async updateSession(sessionId, data) {
    try {
      const client = redis();
      if (!client) return false;
      
      const existingSession = await this.getSession(sessionId);
      if (existingSession) {
        const updatedSession = { ...existingSession, ...data };
        await client.setex(
          `sess:${sessionId}`,
          sessionConfig.store.ttl,
          JSON.stringify(updatedSession)
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating session:', error);
      return false;
    }
  },

  // Get all active sessions for a user
  async getUserSessions(userId) {
    try {
      const client = redis();
      if (!client) return [];
      
      const keys = await client.keys('sess:*');
      const userSessions = [];
      
      for (const key of keys) {
        const sessionData = await client.get(key);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed.userId === userId) {
            userSessions.push({
              sessionId: key.replace('sess:', ''),
              ...parsed
            });
          }
        }
      }
      
      return userSessions;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  },

  // Invalidate all sessions for a user
  async invalidateUserSessions(userId) {
    try {
      const sessions = await this.getUserSessions(userId);
      const client = redis();
      
      if (!client) return false;
      
      for (const session of sessions) {
        await client.del(`sess:${session.sessionId}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error invalidating user sessions:', error);
      return false;
    }
  }
};

module.exports = {
  sessionMiddleware: createSessionMiddleware(),
  sessionConfig,
  sessionHelpers,
};
