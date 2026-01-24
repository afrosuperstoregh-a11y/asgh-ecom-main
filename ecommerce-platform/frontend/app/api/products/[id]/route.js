const { products } = require('../../../../lib/data/products');

export async function GET(request, { params }) {
  try {
    const productId = parseInt(params.id);
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return Response.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 });
    }

    const relatedProducts = products.filter(p => 
      product.relatedProducts.includes(p.id)
    );

    return Response.json({
      success: true,
      data: {
        ...product,
        relatedProducts
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    }, { status: 500 });
  }
}
