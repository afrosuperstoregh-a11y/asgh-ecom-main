"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const categories_1 = require("../../../data/categories");
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
            data: categories_1.categories,
            count: categories_1.categories.length
        }, { headers });
    }
    catch (error) {
        return server_1.NextResponse.json({
            success: false,
            message: 'Error fetching categories',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
