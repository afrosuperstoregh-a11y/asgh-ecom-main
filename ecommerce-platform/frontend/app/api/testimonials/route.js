const { testimonials } = require('../../../lib/data/testimonials');

export async function GET() {
  try {
    return Response.json({
      success: true,
      data: testimonials,
      count: testimonials.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: 'Error fetching testimonials',
      error: error.message
    }, { status: 500 });
  }
}
