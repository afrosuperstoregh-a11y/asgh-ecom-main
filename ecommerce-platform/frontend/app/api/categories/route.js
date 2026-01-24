const { categories } = require('../../../lib/data/categories');

export async function GET() {
  try {
    return Response.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    }, { status: 500 });
  }
}
