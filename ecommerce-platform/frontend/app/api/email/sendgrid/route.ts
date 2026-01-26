import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

interface EmailRequest {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  templateId?: string
  templateData?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const emailRequest: EmailRequest = await request.json()

    if (!emailRequest.to || !emailRequest.subject) {
      return NextResponse.json(
        { error: 'Recipient and subject are required' },
        { status: 400 }
      )
    }

    // Create SendGrid transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@afrosuperstore.com',
      to: emailRequest.to,
      subject: emailRequest.subject,
      text: emailRequest.text,
      html: emailRequest.html,
    }

    // Send email
    const result = await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('SendGrid error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'SendGrid email API endpoint',
    endpoints: {
      'POST /api/email/sendgrid': 'Send email via SendGrid',
    },
  })
}
