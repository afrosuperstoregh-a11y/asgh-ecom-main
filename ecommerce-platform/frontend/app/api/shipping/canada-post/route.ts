import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const CANADA_POST_API_URL = process.env.CANADA_POST_API_URL || 'https://soa-gw.canadapost-postescanada.ca'
const CANADA_POST_USERNAME = process.env.CANADA_POST_USERNAME
const CANADA_POST_PASSWORD = process.env.CANADA_POST_PASSWORD
const CANADA_POST_CUSTOMER_NUMBER = process.env.CANADA_POST_CUSTOMER_NUMBER

interface ShippingRateRequest {
  origin: {
    postalCode: string
    country: string
    province?: string
  }
  destination: {
    postalCode: string
    country: string
    province?: string
  }
  packageDetails: {
    weight: number // in kg
    length?: number // in cm
    width?: number // in cm
    height?: number // in cm
  }
}

export async function POST(request: NextRequest) {
  try {
    const shippingRequest: ShippingRateRequest = await request.json()

    if (!CANADA_POST_USERNAME || !CANADA_POST_PASSWORD || !CANADA_POST_CUSTOMER_NUMBER) {
      return NextResponse.json(
        { error: 'Canada Post credentials not configured' },
        { status: 500 }
      )
    }

    // Create XML request for Canada Post API
    const xmlRequest = `
      <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
        <customer-number>${CANADA_POST_CUSTOMER_NUMBER}</customer-number>
        <origin-postal-code>${shippingRequest.origin.postalCode.replace(/\s/g, '')}</origin-postal-code>
        <destination>
          <domestic>
            <postal-code>${shippingRequest.destination.postalCode.replace(/\s/g, '')}</postal-code>
          </domestic>
        </destination>
        <parcel-characteristics>
          <weight>${shippingRequest.packageDetails.weight}</weight>
          ${shippingRequest.packageDetails.length ? `<dimensions><length>${shippingRequest.packageDetails.length}</length><width>${shippingRequest.packageDetails.width || 10}</width><height>${shippingRequest.packageDetails.height || 10}</height></dimensions>` : ''}
        </parcel-characteristics>
        <services>
          <service-code>DOM.EP</service-code>
          <service-code>DOM.XP</service-code>
          <service-code>DOM.RP</service-code>
        </services>
      </mailing-scenario>
    `

    const auth = Buffer.from(`${CANADA_POST_USERNAME}:${CANADA_POST_PASSWORD}`).toString('base64')

    const response = await axios.post(
      `${CANADA_POST_API_URL}/rs/ship/price`,
      xmlRequest,
      {
        headers: {
          'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
          'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
          'Authorization': `Basic ${auth}`,
        },
      }
    )

    // Parse XML response (simplified - you might want to use an XML parser)
    const rates: Array<{
      service_name: string
      service_code: string
      price: number
      delivery_date?: string
    }> = []
    // Add your XML parsing logic here
    
    return NextResponse.json({
      rates,
      currency: 'CAD',
    })
  } catch (error) {
    console.error('Canada Post API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipping rates' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Canada Post shipping API endpoint',
    endpoints: {
      'POST /api/shipping/canada-post': 'Get shipping rates',
    },
  })
}
