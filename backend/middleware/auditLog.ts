/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express'
import { getSupabaseServer } from '../lib/supabase/server'

interface AuditLogData {
  user_id: string
  action: string
  entity_type: string
  entity_id: string | number
  timestamp: string
  ip_address: string
  user_agent?: string
  old_data?: any
  new_data?: any
}

export function auditLog(action: string, entityType: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original response methods
    const originalSend = res.send
    const originalJson = res.json

    let responseData: any = null
    let isSuccess = false

    // Override response methods to capture data
    res.json = function(data: any) {
      responseData = data
      isSuccess = data?.success !== false
      return originalJson.call(this, data)
    }

    res.send = function(data: any) {
      responseData = data
      return originalSend.call(this, data)
    }

    // Continue with the request
    res.on('finish', () => {
      if (isSuccess && req.user?.userId) {
        const auditData: AuditLogData = {
          user_id: req.user.userId,
          action,
          entity_type: entityType,
          entity_id: typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0] || 'unknown',
          timestamp: new Date().toISOString(),
          ip_address: req.ip || req.connection.remoteAddress || 'unknown',
          user_agent: req.get('User-Agent'),
          old_data: (req as any).oldData,
          new_data: req.body
        }

        // Fire and forget - don't await to avoid blocking
        ;(async () => {
          try {
            await getSupabaseServer()
              .from('audit_logs')
              .insert(auditData as any)
            console.log(`📝 Audit log: ${action} ${entityType} by user ${req.user?.userId}`)
          } catch (error: any) {
            console.error('Audit log error:', error)
            // Don't fail the request if audit logging fails
          }
        })()
      }
    })

    next()
  }
}

// Specific audit log functions for different entities
export const auditProductCreate = auditLog('CREATE', 'product')
export const auditProductUpdate = auditLog('UPDATE', 'product')
export const auditProductDelete = auditLog('DELETE', 'product')
export const auditStockUpdate = auditLog('UPDATE_STOCK', 'product')

export const auditCategoryCreate = auditLog('CREATE', 'category')
export const auditCategoryUpdate = auditLog('UPDATE', 'category')
export const auditCategoryDelete = auditLog('DELETE', 'category')
