"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginationMetadata = exports.ApiResponseUtil = void 0;
class ApiResponseUtil {
    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            statusCode
        });
    }
    static created(res, data, message = 'Resource created successfully') {
        return res.status(201).json({
            success: true,
            message,
            data,
            statusCode: 201
        });
    }
    static noContent(res, message = 'No content') {
        return res.status(204).json({
            success: true,
            message,
            statusCode: 204
        });
    }
    static error(res, message, statusCode = 500, error) {
        return res.status(statusCode).json({
            success: false,
            message,
            ...(error && { error }),
            statusCode
        });
    }
    static paginated(res, data, pagination, message = 'Success') {
        return res.status(200).json({
            success: true,
            message,
            data: {
                items: data,
                pagination
            },
            statusCode: 200
        });
    }
}
exports.ApiResponseUtil = ApiResponseUtil;
// Helper function to create pagination metadata
const createPaginationMetadata = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
};
exports.createPaginationMetadata = createPaginationMetadata;
