const { products } = require('../../../lib/data/products');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const productId = parseInt(id);
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
    }

    return Response.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    }, { status: 500 });
  }
}
