const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

// Initialize Redis client for session storage
let redisClient;
let sessionStore;

try {
  // Only initialize Redis if REDIS_URL is provided
  if (!process.env.REDIS_URL) {
    console.log('ℹ️  REDIS_URL not configured - using MemoryStore for sessions');
  } else {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis reconnection failed after 10 retries');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis client connected');
    });

    // Only connect in production or if REDIS_ENABLED is true and REDIS_URL is set
    if (process.env.NODE_ENV === 'production' || process.env.REDIS_ENABLED === 'true') {
      redisClient.connect().catch(err => {
        console.error('❌ Failed to connect to Redis:', err);
        console.warn('⚠️  Falling back to MemoryStore (not recommended for production)');
      });
    }

    // Create Redis store if Redis is available
    if (process.env.NODE_ENV === 'production' || process.env.REDIS_ENABLED === 'true') {
      sessionStore = new RedisStore({
        client: redisClient,
        prefix: 'asca:sess:',
        ttl: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60, // 24 hours in seconds
      });
      console.log('✅ Redis session store configured');
    }
  }
} catch (error) {
  console.error('❌ Failed to initialize Redis:', error);
  console.warn('⚠️  Falling back to MemoryStore (not recommended for production)');
}

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
  // Use Redis store in production, MemoryStore in development
  store: sessionStore,
};

// Development session configuration adjustments
if (process.env.NODE_ENV !== 'production') {
  sessionConfig.cookie.secure = false;
  sessionConfig.cookie.sameSite = 'lax';
  if (!sessionStore) {
    console.warn('⚠️  Using MemoryStore for sessions (not recommended for production)');
  }
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
      if (!redisClient || !redisClient.isOpen) return null;
      
      const sessionData = await redisClient.get(`asca:sess:${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Destroy session
  async destroySession(sessionId) {
    try {
      if (!redisClient || !redisClient.isOpen) return false;
      
      await redisClient.del(`asca:sess:${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error destroying session:', error);
      return false;
    }
  },

  // Update session data
  async updateSession(sessionId, data) {
    try {
      if (!redisClient || !redisClient.isOpen) return false;
      
      const existingSession = await this.getSession(sessionId);
      if (existingSession) {
        const updatedSession = { ...existingSession, ...data };
        const ttl = parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60;
        await redisClient.setex(
          `asca:sess:${sessionId}`,
          ttl,
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
      if (!redisClient || !redisClient.isOpen) return [];
      
      const keys = await redisClient.keys('asca:sess:*');
      const userSessions = [];
      
      for (const key of keys) {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed.userId === userId) {
            userSessions.push({
              sessionId: key.replace('asca:sess:', ''),
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
      
      if (!redisClient || !redisClient.isOpen) return false;
      
      for (const session of sessions) {
        await redisClient.del(`asca:sess:${session.sessionId}`);
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

