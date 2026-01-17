import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class ApiResponseUtil {
  static success<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response<ApiResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      statusCode
    });
  }

  static created<T>(
    res: Response,
    data?: T,
    message: string = 'Resource created successfully'
  ): Response<ApiResponse<T>> {
    return res.status(201).json({
      success: true,
      message,
      data,
      statusCode: 201
    });
  }

  static noContent(
    res: Response,
    message: string = 'No content'
  ): Response<ApiResponse> {
    return res.status(204).json({
      success: true,
      message,
      statusCode: 204
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    error?: any
  ): Response<ApiResponse> {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(error && { error }),
      statusCode
    });
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message: string = 'Success'
  ): Response<ApiResponse<{
    items: T[];
    pagination: typeof pagination;
  }>> {
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

// Helper function to create pagination metadata
export const createPaginationMetadata = (
  page: number,
  limit: number,
  total: number
) => {
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
