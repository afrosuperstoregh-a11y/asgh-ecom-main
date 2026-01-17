import { PrismaClient } from '@prisma/client';
import { SecurityUtils, SecurityLogger, MFAService, DeviceSecurity, JWTUtils, AccountSecurity, SessionManager } from '../middleware/security';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Define enums locally since they're not exported from Prisma client
enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_CHALLENGE = 'MFA_CHALLENGE',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETION = 'DATA_DELETION',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  SECURITY_POLICY_VIOLATION = 'SECURITY_POLICY_VIOLATION',
  MALICIOUS_REQUEST = 'MALICIOUS_REQUEST',
  BRUTE_FORCE_ATTACK = 'BRUTE_FORCE_ATTACK',
  INJECTION_ATTACK = 'INJECTION_ATTACK',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  SESSION_HIJACK = 'SESSION_HIJACK',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  API_ABUSE = 'API_ABUSE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  ANOMALOUS_BEHAVIOR = 'ANOMALOUS_BEHAVIOR',
  DEVICE_TRUST_CHANGE = 'DEVICE_TRUST_CHANGE',
  LOCATION_ANOMALY = 'LOCATION_ANOMALY',
}

enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

enum DsrType {
  ACCESS = 'ACCESS',
  DELETION = 'DELETION',
  PORTABILITY = 'PORTABILITY',
  RESTRICTION = 'RESTRICTION',
  OBJECTION = 'OBJECTION',
  RECTIFICATION = 'RECTIFICATION',
}

enum DsrStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

enum BreachSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

const prisma = new PrismaClient();

export class SecurityService {
  // Authentication & Session Management
  static async loginUser(email: string, password: string, request: any) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { securitySessions: true }
    });

    if (!user) {
      await SecurityLogger.logEvent({
        type: SecurityEventType.LOGIN_FAILURE,
        severity: SecuritySeverity.MEDIUM,
        description: `Login attempt with non-existent email: ${email}`,
        ipAddress: request.ip,
        userAgent: request.userAgent,
      });
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await SecurityUtils.verifyPassword(password, user.password!);
    if (!isValidPassword) {
      await AccountSecurity.handleFailedLogin(email, request.ip);
      throw new Error('Invalid credentials');
    }

    // Check for anomalies
    const anomalies = await DeviceSecurity.detectAnomalies(user.id, request);
    if (anomalies.length > 0) {
      await SecurityLogger.logEvent({
        type: SecurityEventType.SUSPICIOUS_LOGIN,
        severity: SecuritySeverity.HIGH,
        description: `Anomalies detected: ${anomalies.join(', ')}`,
        userId: user.id,
        ipAddress: request.ip,
        userAgent: request.userAgent,
        details: { anomalies },
      });
    }

    // Generate tokens
    const accessToken = await JWTUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await JWTUtils.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Create session
    const session = await SessionManager.createSession(user.id, accessToken, request);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes
      },
      session,
      requiresMFA: !user.mfaEnabled,
      anomalies,
    };
  }

  // Multi-Factor Authentication
  static async setupMFA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { mfaDevices: true }
    });

    if (!user) throw new Error('User not found');

    const { secret, qrCode } = MFAService.generateSecret(user.email!);
    const backupCodes = MFAService.generateBackupCodes();

    // Encrypt and store MFA setup
    const encryptedSecret = SecurityUtils.encrypt(secret);
    const encryptedBackupCodes = SecurityUtils.encrypt(JSON.stringify(backupCodes));

    await prisma.mfaDevice.create({
      data: {
        userId,
        type: 'TOTP',
        name: 'Primary Device',
        secret: encryptedSecret.encrypted,
        backupCodes: encryptedBackupCodes.encrypted,
        isVerified: false,
        isPrimary: true,
      }
    });

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  static async verifyAndEnableMFA(userId: string, secret: string, token: string) {
    const isValid = MFAService.verifyToken(secret, token);
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    await prisma.mfaDevice.updateMany({
      where: { userId, type: 'TOTP' },
      data: { isVerified: true }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true }
    });

    await SecurityLogger.logEvent({
      type: SecurityEventType.MFA_ENABLED,
      severity: SecuritySeverity.MEDIUM,
      description: 'Multi-factor authentication enabled',
      userId,
    });

    return { success: true };
  }

  // Data Subject Requests (GDPR)
  static async createDataSubjectRequest(data: {
    email: string;
    type: DsrType;
    description?: string;
  }) {
    const requestId = `DSR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const verificationToken = SecurityUtils.generateSecureToken();

    const request = await prisma.dataSubjectRequest.create({
      data: {
        requestId,
        email: data.email,
        type: data.type,
        description: data.description,
        verificationToken,
        status: DsrStatus.PENDING,
      }
    });

    // Send verification email
    await this.sendDSRVerificationEmail(data.email, verificationToken, requestId);

    await SecurityLogger.logEvent({
      type: SecurityEventType.DATA_ACCESS,
      severity: SecuritySeverity.MEDIUM,
      description: `Data subject request created: ${data.type}`,
      details: { requestId, email: data.email, type: data.type },
    });

    return request;
  }

  static async processDataSubjectRequest(requestId: string, userId?: string) {
    const request = await prisma.dataSubjectRequest.findUnique({
      where: { requestId },
    });

    if (!request) throw new Error('Request not found');

    switch (request.type) {
      case DsrType.ACCESS:
        return await this.processDataAccessRequest(request, userId);
      case DsrType.DELETION:
        return await this.processDataDeletionRequest(request, userId);
      case DsrType.PORTABILITY:
        return await this.processDataPortabilityRequest(request, userId);
      default:
        throw new Error('Unsupported request type');
    }
  }

  private static async processDataAccessRequest(request: any, userId?: string) {
    const userData = await this.collectUserData(request.email, userId);
    
    // Create encrypted export
    const exportData = {
      requestId: request.requestId,
      generatedAt: new Date().toISOString(),
      userData,
    };

    const exportPath = `/tmp/dsr-export-${request.requestId}.json`;
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));

    // Upload to secure storage
    const exportUrl = await this.uploadToSecureStorage(exportPath, `dsr-exports/${request.requestId}.json`);

    await prisma.dataSubjectRequest.update({
      where: { id: request.id },
      data: {
        status: DsrStatus.COMPLETED,
        dataExportUrl: exportUrl,
        completedAt: new Date(),
      }
    });

    // Send notification email
    await this.sendDSRCompletionEmail(request.email, exportUrl, request.type);

    return { success: true, exportUrl };
  }

  private static async processDataDeletionRequest(request: any, userId?: string) {
    // Anonymize user data instead of hard deletion for audit purposes
    const anonymizedData = {
      email: `deleted-${request.requestId}@deleted.com`,
      name: 'DELETED USER',
      phone: null,
      password: null,
      emailVerified: false,
      // Keep audit-related fields
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await prisma.user.updateMany({
      where: { email: request.email },
      data: anonymizedData,
    });

    // Deactivate all sessions
    await this.deactivateAllUserSessions(request.email);

    await prisma.dataSubjectRequest.update({
      where: { id: request.id },
      data: {
        status: DsrStatus.COMPLETED,
        deletionSummary: { anonymizedFields: Object.keys(anonymizedData) },
        completedAt: new Date(),
      }
    });

    await this.sendDSRCompletionEmail(request.email, null, request.type);

    return { success: true };
  }

  private static async processDataPortabilityRequest(request: any, userId?: string) {
    const userData = await this.collectUserData(request.email, userId);
    
    // Create portable data export in standard format (JSON-LD)
    const exportData = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      requestId: request.requestId,
      generatedAt: new Date().toISOString(),
      userData: userData,
    };

    const exportPath = `/tmp/dsr-portability-${request.requestId}.json`;
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));

    // Upload to secure storage
    const exportUrl = await this.uploadToSecureStorage(exportPath, `dsr-portability/${request.requestId}.json`);

    await prisma.dataSubjectRequest.update({
      where: { id: request.id },
      data: {
        status: DsrStatus.COMPLETED,
        dataExportUrl: exportUrl,
        completedAt: new Date(),
      }
    });

    // Send notification email
    await this.sendDSRCompletionEmail(request.email, exportUrl, request.type);

    return { success: true, exportUrl };
  }

  // Security Scanning & Monitoring
  static async initiateSecurityScan(type: string, target: string) {
    const scan = await prisma.securityScan.create({
      data: {
        type: type as any,
        target,
        status: 'PENDING',
        scheduledAt: new Date(),
      }
    });

    // Queue scan job
    await this.queueSecurityScan(scan.id);

    await SecurityLogger.logEvent({
      type: SecurityEventType.SECURITY_POLICY_VIOLATION,
      severity: SecuritySeverity.MEDIUM,
      description: `Security scan initiated: ${type} for ${target}`,
      details: { scanId: scan.id, type, target },
    });

    return scan;
  }

  static async processSecurityScanResults(scanId: string, results: any) {
    const scan = await prisma.securityScan.findUnique({
      where: { id: scanId },
    });

    if (!scan) throw new Error('Scan not found');

    const summary = this.analyzeScanResults(results);

    await prisma.securityScan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        findings: results,
        summary,
        criticalCount: summary.critical,
        highCount: summary.high,
        mediumCount: summary.medium,
        lowCount: summary.low,
        infoCount: summary.info,
        completedAt: new Date(),
      }
    });

    // Send alerts for critical findings
    if (summary.critical > 0) {
      await this.sendSecurityAlert({
        type: 'CRITICAL_VULNERABILITIES',
        message: `Critical vulnerabilities found in ${scan.target}`,
        details: summary,
      });
    }

    return scan;
  }

  // Data Breach Management
  static async reportDataBreach(data: {
    severity: BreachSeverity;
    type: string;
    description: string;
    affectedDataTypes: string[];
    rootCause?: string;
  }) {
    const incidentId = `BR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const breach = await prisma.dataBreach.create({
      data: {
        incidentId,
        severity: data.severity,
        type: data.type as any,
        description: data.description,
        affectedDataTypes: data.affectedDataTypes,
        rootCause: data.rootCause,
        discoveryDate: new Date(),
        status: 'INVESTIGATING',
      }
    });

    // Initiate incident response
    await this.initiateIncidentResponse(breach.id);

    await SecurityLogger.logEvent({
      type: SecurityEventType.DATA_ACCESS,
      severity: SecuritySeverity.CRITICAL,
      description: `Data breach reported: ${data.type}`,
      details: { incidentId, severity: data.severity },
    });

    return breach;
  }

  static async updateBreachStatus(breachId: string, status: string, notes?: string) {
    const breach = await prisma.dataBreach.update({
      where: { id: breachId },
      data: {
        status: status as any,
        processingNotes: notes,
        updatedAt: new Date(),
      }
    });

    // Check if notification is required
    if (status === 'RESOLVED' && breach.notifiedAuthorities) {
      await this.sendBreachResolutionNotification(breach);
    }

    return breach;
  }

  // Consent Management
  static async recordConsent(data: {
    userId?: string;
    email?: string;
    sessionId?: string;
    type: string;
    purpose: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const consent = await prisma.consentRecord.create({
      data: {
        userId: data.userId,
        email: data.email,
        sessionId: data.sessionId,
        type: data.type as any,
        purpose: data.purpose,
        status: 'GRANTED',
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        documentVersion: '1.0',
        lawfulBasis: 'consent',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }
    });

    await SecurityLogger.logEvent({
      type: SecurityEventType.DATA_MODIFICATION,
      severity: SecuritySeverity.LOW,
      description: `Consent recorded: ${data.purpose}`,
      userId: data.userId,
      details: { consentId: consent.id, purpose: data.purpose },
    });

    return consent;
  }

  static async withdrawConsent(consentId: string, reason?: string) {
    const consent = await prisma.consentRecord.update({
      where: { id: consentId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
      }
    });

    await SecurityLogger.logEvent({
      type: SecurityEventType.DATA_MODIFICATION,
      severity: SecuritySeverity.MEDIUM,
      description: `Consent withdrawn: ${consent.purpose}`,
      userId: consent.userId,
      details: { consentId, reason },
    });

    return consent;
  }

  // Security Compliance
  static async updateComplianceStatus(data: {
    framework: string;
    requirement: string;
    control: string;
    status: string;
    evidence?: any;
    artifacts?: string[];
  }) {
    const compliance = await prisma.securityCompliance.upsert({
      where: {
        framework_requirement_control: {
          framework: data.framework,
          requirement: data.requirement,
          control: data.control,
        }
      },
      update: {
        status: data.status as any,
        evidence: data.evidence,
        artifacts: data.artifacts,
        lastAssessed: new Date(),
      },
      create: {
        framework: data.framework,
        requirement: data.requirement,
        control: data.control,
        status: data.status as any,
        evidence: data.evidence,
        artifacts: data.artifacts,
        lastAssessed: new Date(),
      }
    });

    await SecurityLogger.logEvent({
      type: SecurityEventType.SECURITY_POLICY_VIOLATION,
      severity: SecuritySeverity.LOW,
      description: `Compliance status updated: ${data.framework}`,
      details: { requirement: data.requirement, control: data.control, status: data.status },
    });

    return compliance;
  }

  // Security Training
  static async assignTraining(data: {
    userId?: string;
    adminUserId?: string;
    courseName: string;
    courseType: string;
    expiresAt?: Date;
  }) {
    const training = await prisma.securityTraining.create({
      data: {
        userId: data.userId,
        adminUserId: data.adminUserId,
        courseName: data.courseName,
        courseType: data.courseType as any,
        status: 'ASSIGNED',
        expiresAt: data.expiresAt,
      }
    });

    // Send training assignment notification
    if (data.userId) {
      await this.sendTrainingNotification(data.userId, training);
    }

    return training;
  }

  static async completeTraining(trainingId: string, score?: number) {
    const training = await prisma.securityTraining.update({
      where: { id: trainingId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        score,
      }
    });

    await SecurityLogger.logEvent({
      type: SecurityEventType.PRIVILEGE_ESCALATION,
      severity: SecuritySeverity.LOW,
      description: `Training completed: ${training.courseName}`,
      userId: training.userId,
      details: { trainingId, score },
    });

    return training;
  }

  // Utility methods
  private static async collectUserData(email: string, userId?: string) {
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        orders: true,
        addresses: true,
        paymentMethods: true,
        reviews: true,
        securitySessions: true,
        consentRecords: true,
        dataSubjectRequests: true,
      }
    });

    if (!user) return null;

    // Remove sensitive data
    const { password, ...safeUserData } = user;
    return safeUserData;
  }

  private static async uploadToSecureStorage(filePath: string, key: string): Promise<string> {
    // Implementation depends on your cloud provider
    // This is a placeholder for AWS S3, Google Cloud Storage, etc.
    return `https://secure-storage.example.com/${key}`;
  }

  private static async sendDSRVerificationEmail(email: string, token: string, requestId: string) {
    // Implementation with your email service
    console.log(`DSR verification email sent to ${email} for request ${requestId}`);
  }

  private static async sendDSRCompletionEmail(email: string, exportUrl: string | null, type: DsrType) {
    // Implementation with your email service
    console.log(`DSR completion email sent to ${email} for ${type}`);
  }

  private static async sendSecurityAlert(alert: any) {
    // Implementation with your alerting system
    console.log('SECURITY ALERT:', alert);
  }

  private static async sendBreachResolutionNotification(breach: any) {
    // Implementation for breach resolution notifications
    console.log(`Breach resolution notification sent for ${breach.incidentId}`);
  }

  private static async sendTrainingNotification(userId: string, training: any) {
    // Implementation for training notifications
    console.log(`Training notification sent to user ${userId} for ${training.courseName}`);
  }

  private static async queueSecurityScan(scanId: string) {
    // Implementation with your job queue
    console.log(`Security scan ${scanId} queued`);
  }

  private static async initiateIncidentResponse(breachId: string) {
    // Implementation for incident response workflow
    console.log(`Incident response initiated for breach ${breachId}`);
  }

  private static async deactivateAllUserSessions(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.securitySession.updateMany({
        where: { userId: user.id },
        data: { isActive: false }
      });
    }
  }

  private static analyzeScanResults(results: any) {
    // Analyze scan results and categorize by severity
    return {
      critical: results.critical || 0,
      high: results.high || 0,
      medium: results.medium || 0,
      low: results.low || 0,
      info: results.info || 0,
      total: (results.critical || 0) + (results.high || 0) + (results.medium || 0) + (results.low || 0) + (results.info || 0),
    };
  }
}
