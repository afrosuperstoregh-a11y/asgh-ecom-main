"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const products_1 = require("../../../data/products");
async function GET(request) {
    try {
        // Enable CORS
        const headers = new Headers({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });
        if (request.method === 'OPTIONS') {
            return new server_1.NextResponse(null, { status: 200, headers });
        }
        return server_1.NextResponse.json({
            success: true,
            data: products_1.products,
            count: products_1.products.length
        }, { headers });
    }
    catch (error) {
        return server_1.NextResponse.json({
            success: false,
            message: 'Error fetching products',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
