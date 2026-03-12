import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase/server'

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

export async function auditLog(action: string, entityType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
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
    res.on('finish', async () => {
      if (isSuccess && req.user?.userId) {
        try {
          const auditData: AuditLogData = {
            user_id: req.user.userId,
            action,
            entity_type: entityType,
            entity_id: req.params.id || 'unknown',
            timestamp: new Date().toISOString(),
            ip_address: req.ip || req.connection.remoteAddress || 'unknown',
            user_agent: req.get('User-Agent'),
            old_data: req.oldData,
            new_data: req.body
          }

          await supabase
            .from('audit_logs')
            .insert(auditData)

          console.log(`📝 Audit log: ${action} ${entityType} by user ${req.user.userId}`)
        } catch (error) {
          console.error('Audit log error:', error)
          // Don't fail the request if audit logging fails
        }
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
