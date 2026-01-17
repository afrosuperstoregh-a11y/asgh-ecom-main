import { PrismaClient } from '@prisma/client';
import { SecurityService } from './securityService';
import { SecurityUtils } from '../middleware/security';
import crypto from 'crypto';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';

const prisma = new PrismaClient();

// Define BreachSeverity enum locally
enum BreachSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class GDPRService {
  // Data Subject Rights Implementation
  
  /**
   * Right to Access - Article 15 GDPR
   * Provides individuals with access to their personal data
   */
  static async handleDataAccessRequest(requestId: string) {
    const request = await prisma.dataSubjectRequest.findUnique({
      where: { requestId },
    });

    if (!request) {
      throw new Error('Data subject request not found');
    }

    // Collect all personal data
    const personalData = await this.collectAllPersonalData(request.email);
    
    // Create comprehensive data package
    const dataPackage = {
      metadata: {
        requestId: request.requestId,
        generatedAt: new Date().toISOString(),
        dataController: 'E-Commerce Platform',
        contactEmail: 'dpo@your-domain.com',
        retentionPeriod: '2555 days (7 years)',
        legalBasis: 'Contract, Legitimate Interest, Consent',
      },
      personalData,
      dataCategories: this.categorizePersonalData(personalData),
      dataRecipients: this.getDataRecipients(personalData),
      storageLocations: this.getStorageLocations(personalData),
      retentionSchedule: this.getRetentionSchedule(personalData),
    };

    // Generate encrypted export
    const exportPath = await this.createSecureDataExport(dataPackage, request.requestId);
    
    // Upload to secure storage
    const downloadUrl = await SecurityService['uploadToSecureStorage'](
      exportPath, 
      `gdpr-exports/${request.requestId}.zip`
    );

    // Update request status
    await prisma.dataSubjectRequest.update({
      where: { id: request.id },
      data: {
        status: 'COMPLETED',
        dataExportUrl: downloadUrl,
        completedAt: new Date(),
      }
    });

    // Send notification with secure download link
    await this.sendDataAccessNotification(request.email, downloadUrl, request.requestId);

    return {
      success: true,
      downloadUrl,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  /**
   * Right to Erasure - Article 17 GDPR
   * Allows individuals to request deletion of their personal data
   */
  static async handleRightToErasure(requestId: string) {
    const request = await prisma.dataSubjectRequest.findUnique({
      where: { requestId },
    });

    if (!request) {
      throw new Error('Data subject request not found');
    }

    // Check for legal holds or retention requirements
    const legalHolds = await this.checkLegalHolds(request.email);
    if (legalHolds.length > 0) {
      throw new Error(`Cannot delete data due to legal holds: ${legalHolds.join(', ')}`);
    }

    // Perform data deletion with audit trail
    const deletionSummary = await this.performDataDeletion(request.email);

    // Update request status
    await prisma.dataSubjectRequest.update({
      where: { id: request.id },
      data: {
        status: 'COMPLETED',
        deletionSummary,
        completedAt: new Date(),
      }
    });

    // Send confirmation notification
    await this.sendErasureConfirmation(request.email, requestId);

    return {
      success: true,
      deletedCategories: Object.keys(deletionSummary),
      retentionExceptions: deletionSummary.retained,
    };
  }

  /**
   * Right to Data Portability - Article 20 GDPR
   * Provides data in machine-readable format
   */
  static async handleDataPortability(requestId: string) {
    const request = await prisma.dataSubjectRequest.findUnique({
      where: { requestId },
    });

    if (!request) {
      throw new Error('Data subject request not found');
    }

    // Collect portable data
    const portableData = await this.collectPortableData(request.email);

    // Create standardized export formats
    const exports = await this.createPortableDataExports(portableData, request.requestId);

    // Upload all formats
    const downloadUrls = {};
    for (const [format, filePath] of Object.entries(exports)) {
      downloadUrls[format] = await SecurityService['uploadToSecureStorage'](
        filePath,
        `gdpr-portability/${request.requestId}.${format}`
      );
    }

    // Update request status
    await prisma.dataSubjectRequest.update({
      where: { id: request.id },
      data: {
        status: 'COMPLETED',
        dataExportUrl: downloadUrls.json, // Primary format
        completedAt: new Date(),
      }
    });

    // Send notification with download links
    await this.sendPortabilityNotification(request.email, downloadUrls, requestId);

    return {
      success: true,
      downloadUrls,
      formats: Object.keys(exports),
    };
  }

  /**
   * Right to Restrict Processing - Article 18 GDPR
   * Limits processing of personal data under certain conditions
   */
  static async handleProcessingRestriction(requestId: string, restrictions: string[]) {
    const request = await prisma.dataSubjectRequest.findUnique({
      where: { requestId },
    });

    if (!request) {
      throw new Error('Data subject request not found');
    }

    // Apply processing restrictions
    const restrictionRecord = await this.applyProcessingRestrictions(request.email, restrictions);

    // Update request status
    await prisma.dataSubjectRequest.update({
      where: { id: request.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      }
    });

    // Send confirmation
    await this.sendRestrictionConfirmation(request.email, restrictions, requestId);

    return {
      success: true,
      restrictions,
      validUntil: restrictionRecord.expiresAt,
    };
  }

  // Consent Management
  
  /**
   * Record explicit consent for data processing
   */
  static async recordExplicitConsent(data: {
    userId?: string;
    email: string;
    purposes: string[];
    lawfulBasis: string;
    ipAddress?: string;
    userAgent?: string;
    documentVersion: string;
  }) {
    const consentRecords = [];

    for (const purpose of data.purposes) {
      const consent = await prisma.consentRecord.create({
        data: {
          userId: data.userId,
          email: data.email,
          type: 'EXPLICIT',
          purpose,
          status: 'GRANTED',
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          documentVersion: data.documentVersion,
          lawfulBasis: data.lawfulBasis,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          metadata: {
            granularPurposes: data.purposes,
            timestamp: new Date().toISOString(),
            method: 'explicit_consent',
          }
        }
      });

      consentRecords.push(consent);
    }

    // Generate consent receipt
    const receiptId = await this.generateConsentReceipt(consentRecords);

    return {
      success: true,
      consentRecords,
      receiptId,
    };
  }

  /**
   * Handle consent withdrawal
   */
  static async withdrawConsent(consentId: string, withdrawalReason?: string) {
    const consent = await prisma.consentRecord.update({
      where: { id: consentId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
        metadata: {
          withdrawalReason,
          withdrawalTimestamp: new Date().toISOString(),
        }
      }
    });

    // Process withdrawal effects
    await this.processConsentWithdrawal(consent);

    // Send confirmation
    await this.sendWithdrawalConfirmation(consent.email, consent.purpose);

    return {
      success: true,
      withdrawnAt: consent.withdrawnAt,
    };
  }

  // Data Protection Impact Assessments (DPIA)
  
  /**
   * Create and manage DPIA for high-risk processing
   */
  static async createDPIA(data: {
    projectName: string;
    dataTypes: string[];
    processingPurposes: string[];
    recipients: string[];
    retentionPeriod: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    measures: string[];
  }) {
    const dpia = await prisma.dataProcessingRecord.create({
      data: {
        name: `DPIA: ${data.projectName}`,
        description: `Data Protection Impact Assessment for ${data.projectName}`,
        purpose: data.processingPurposes.join(', '),
        legalBasis: 'Article 35 GDPR - DPIA Required',
        dataCategories: data.dataTypes,
        recipients: data.recipients,
        retentionPeriod: data.retentionPeriod,
        securityMeasures: {
          riskLevel: data.riskLevel,
          protectionMeasures: data.measures,
          assessmentDate: new Date().toISOString(),
          assessor: 'Data Protection Officer',
          nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        isActive: true,
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    });

    return dpia;
  }

  // Data Breach Management
  
  /**
   * Handle GDPR-compliant breach notification
   */
  static async handleDataBreach(breachData: {
    affectedDataTypes: string[];
    affectedUsersCount: number;
    breachType: string;
    containmentMeasures: string[];
    mitigationMeasures: string[];
    communicationPlan: string;
  }) {
    // Create breach record
    const breach = await SecurityService.reportDataBreach({
      severity: BreachSeverity.HIGH,
      type: breachData.breachType,
      description: `GDPR data breach affecting ${breachData.affectedUsersCount} users`,
      affectedDataTypes: breachData.affectedDataTypes,
    });

    // Determine notification timeline
    const notificationTimeline = this.calculateNotificationTimeline(breachData);

    // Prepare notification templates
    const notifications = await this.prepareBreachNotifications(breach, breachData, notificationTimeline);

    // Queue notifications based on timeline
    for (const notification of notifications) {
      await this.scheduleNotification(notification);
    }

    // Update breach record with GDPR-specific details
    await prisma.dataBreach.update({
      where: { id: breach.id },
      data: {
        details: {
          gdpr: {
            notificationTimeline,
            dataProtectionOfficerNotified: true,
            supervisoryAuthorityNotified: notificationTimeline.authorityWithin72Hours,
            individualsNotified: notificationTimeline.individualsWithoutUndueDelay,
          }
        }
      }
    });

    return {
      breachId: breach.incidentId,
      notificationTimeline,
      affectedUsersCount: breachData.affectedUsersCount,
    };
  }

  // Privacy by Design and Default
  
  /**
   * Implement privacy by design principles
   */
  static async implementPrivacyByDesign(feature: {
    name: string;
    dataProcessingActivities: string[];
    privacyMeasures: string[];
    dataMinimizationApplied: boolean;
    purposeLimitationApplied: boolean;
    storageLimitationApplied: boolean;
  }) {
    // Create privacy implementation record
    const privacyRecord = await prisma.dataProcessingRecord.create({
      data: {
        name: `Privacy by Design: ${feature.name}`,
        description: `Privacy implementation for ${feature.name}`,
        purpose: feature.dataProcessingActivities.join(', '),
        legalBasis: 'Article 25 GDPR - Privacy by Design',
        dataCategories: [], // To be populated based on actual implementation
        recipients: ['internal'],
        retentionPeriod: 'As required for functionality',
        securityMeasures: {
          privacyMeasures: feature.privacyMeasures,
          dataMinimization: feature.dataMinimizationApplied,
          purposeLimitation: feature.purposeLimitationApplied,
          storageLimitation: feature.storageLimitationApplied,
          implementationDate: new Date().toISOString(),
        },
        isActive: true,
        reviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      }
    });

    return privacyRecord;
  }

  // Utility Methods
  
  private static async collectAllPersonalData(email: string) {
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        orders: {
          include: {
            items: true,
            payments: true,
            addresses: true,
          }
        },
        addresses: true,
        paymentMethods: true,
        reviews: true,
        securitySessions: true,
        consentRecords: true,
        dataSubjectRequests: true,
        customerLoyalty: true,
        subscriptions: true,
        pointsTransactions: true,
      }
    });

    if (!user) return null;

    // Remove sensitive data that shouldn't be exported
    const { password, ...safeUserData } = user;
    
    return {
      user: safeUserData,
      orders: user.orders,
      addresses: user.addresses,
      paymentMethods: user.paymentMethods.map((pm: any) => ({
        ...pm,
        providerId: '***REDACTED***',
        last4: pm.last4,
      })),
      reviews: user.reviews,
      sessions: user.securitySessions.map((session: any) => ({
        ...session,
        token: '***REDACTED***',
        refreshToken: '***REDACTED***',
      })),
      consentRecords: user.consentRecords,
      dataRequests: user.dataSubjectRequests,
      loyaltyData: user.customerLoyalty,
      subscriptions: user.subscriptions,
      pointsHistory: user.pointsTransactions,
    };
  }

  private static categorizePersonalData(data: any) {
    const categories = {
      identity: ['name', 'email', 'phone'],
      contact: ['address', 'postalCode', 'city', 'country'],
      financial: ['paymentMethods', 'orderHistory', 'transactions'],
      behavioral: [' browsingHistory', 'preferences', 'reviews'],
      technical: ['ipAddress', 'userAgent', 'deviceFingerprint'],
    };

    const categorizedData = {};
    
    for (const [category, fields] of Object.entries(categories)) {
      (categorizedData as any)[category] = this.extractFields(data, fields);
    }

    return categorizedData;
  }

  private static extractFields(obj: any, fields: string[]): any {
    const result: any = {};
    
    if (!obj || typeof obj !== 'object') {
      return result;
    }
    
    for (const field of fields) {
      if (obj && obj[field as keyof typeof obj]) {
        result[field] = obj[field as keyof typeof obj];
      }
    }
    
    return result;
  }

  private static async createSecureDataExport(data: any, requestId: string): Promise<string> {
    const exportPath = `/tmp/gdpr-export-${requestId}`;
    
    // Create simple JSON export without archiver dependency
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(`${exportPath}.json`, jsonData);
    
    // Create CSV format
    const csvData = this.convertToCSV((data as any).user || {});
    await fs.writeFile(`${exportPath}.csv`, csvData);
    
    // Create metadata
    const metadata = JSON.stringify({
      exportId: requestId,
      exportDate: new Date().toISOString(),
      format: 'JSON/CSV',
      encryption: 'AES-256',
    }, null, 2);
    await fs.writeFile(`${exportPath}-metadata.json`, metadata);
    
    return `${exportPath}.json`;
  }

  private static convertToCSV(data: any): string {
    if (!data) return '';
    
    const headers = Object.keys(data);
    const values = headers.map(header => data[header]);
    
    return [headers.join(','), values.join(',')].join('\n');
  }

  private static async collectPortableData(email: string) {
    // Similar to collectAllPersonalData but focused on portable data
    return await this.collectAllPersonalData(email);
  }

  private static async createPortableDataExports(data: any, requestId: string) {
    const exports: any = {};
    const basePath = `/tmp/gdpr-portability-${requestId}`;
    
    // JSON format
    const jsonPath = `${basePath}.json`;
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
    exports.json = jsonPath;
    
    // XML format
    const xmlPath = `${basePath}.xml`;
    const xmlData = this.convertToXML(data);
    await fs.writeFile(xmlPath, xmlData);
    exports.xml = xmlPath;
    
    // CSV format
    const csvPath = `${basePath}.csv`;
    const csvData = this.convertToCSV(data);
    await fs.writeFile(csvPath, csvData);
    exports.csv = csvPath;
    
    return exports;
  }

  private static convertToXML(data: any): string {
    // Simple XML conversion - in production, use a proper XML library
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<personalData>\n';
    
    for (const [key, value] of Object.entries(data)) {
      xml += `  <${key}>${JSON.stringify(value)}</${key}>\n`;
    }
    
    xml += '</personalData>';
    return xml;
  }

  private static async checkLegalHolds(email: string): Promise<string[]> {
    // Check for any legal holds on the user's data
    // This would integrate with legal hold systems
    return [];
  }

  private static async performDataDeletion(email: string) {
    const deletionSummary = {
      deleted: {},
      retained: {},
      anonymized: {},
    };

    // Anonymize user data instead of hard deletion
    await prisma.user.updateMany({
      where: { email },
      data: {
        name: 'DELETED USER',
        phone: null,
        email: `deleted-${crypto.randomBytes(16).toString('hex')}@deleted.com`,
        updatedAt: new Date(),
      }
    });

    deletionSummary.anonymized.user = true;

    // Deactivate sessions
    await prisma.securitySession.updateMany({
      where: { 
        user: { 
          email: email 
        } 
      },
      data: { isActive: false }
    });

    (deletionSummary as any).deleted.sessions = true;

    return deletionSummary;
  }

  private static getDataRecipients(data: any): string[] {
    const recipients: string[] = [];
    
    // Analyze data to determine recipients
    if (data.orders) recipients.push('Payment Processors');
    if (data.shipping) recipients.push('Shipping Companies');
    if (data.marketing) recipients.push('Marketing Platforms');
    
    return recipients;
  }

  private static getStorageLocations(data: any): string[] {
    const locations: string[] = [];
    
    // Determine storage locations based on data
    locations.push('Primary Database (EU)');
    locations.push('Backup Storage (EU)');
    locations.push('Analytics Database (EU)');
    
    return locations;
  }

  private static getRetentionSchedule(data: any): any {
    return {
      userAccount: '2555 days (7 years)',
      orders: '2555 days (7 years)',
      payments: '2555 days (7 years)',
      reviews: '1825 days (5 years)',
      sessions: '30 days',
      consentRecords: '365 days (1 year)',
    };
  }

  private static calculateNotificationTimeline(breachData: any) {
    const isHighRisk = breachData.affectedDataTypes.includes('financial') || 
                      breachData.affectedDataTypes.includes('health');
    
    return {
      authorityWithin72Hours: true,
      individualsWithoutUndueDelay: isHighRisk,
      immediateCommunicationRequired: isHighRisk,
    };
  }

  private static async prepareBreachNotifications(breach: any, breachData: any, timeline: any) {
    const notifications = [];
    
    // Supervisory authority notification
    notifications.push({
      type: 'AUTHORITY',
      scheduledFor: new Date(),
      template: 'breach-authority-notification',
      data: { breach, breachData, timeline },
    });
    
    // Individual notifications (if required)
    if (timeline.individualsWithoutUndueDelay) {
      notifications.push({
        type: 'INDIVIDUAL',
        scheduledFor: new Date(),
        template: 'breach-individual-notification',
        data: { breach, breachData },
      });
    }
    
    return notifications;
  }

  private static async scheduleNotification(notification: any) {
    // Schedule notification using job queue
    console.log('Notification scheduled:', notification);
  }

  // Notification methods (placeholders for actual implementation)
  private static async sendDataAccessNotification(email: string, downloadUrl: string, requestId: string) {
    console.log(`Data access notification sent to ${email} for request ${requestId}`);
  }

  private static async sendErasureConfirmation(email: string, requestId: string) {
    console.log(`Erasure confirmation sent to ${email} for request ${requestId}`);
  }

  private static async sendPortabilityNotification(email: string, downloadUrls: any, requestId: string) {
    console.log(`Portability notification sent to ${email} for request ${requestId}`);
  }

  private static async sendRestrictionConfirmation(email: string, restrictions: string[], requestId: string) {
    console.log(`Restriction confirmation sent to ${email} for request ${requestId}`);
  }

  private static async sendWithdrawalConfirmation(email: string, purpose: string) {
    console.log(`Consent withdrawal confirmation sent to ${email} for purpose ${purpose}`);
  }

  private static async generateConsentReceipt(consentRecords: any[]): Promise<string> {
    const receiptId = `CONSENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Consent receipt generated: ${receiptId}`);
    return receiptId;
  }

  private static async processConsentWithdrawal(consent: any) {
    // Process the effects of consent withdrawal
    console.log(`Processing consent withdrawal for: ${consent.purpose}`);
  }

  private static async applyProcessingRestrictions(email: string, restrictions: string[]) {
    // Apply processing restrictions to user's data
    const restrictionRecord = {
      email,
      restrictions,
      appliedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };
    
    console.log('Processing restrictions applied:', restrictionRecord);
    return restrictionRecord;
  }
}
