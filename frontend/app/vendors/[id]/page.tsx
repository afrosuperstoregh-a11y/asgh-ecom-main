'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Star, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Package,
  ShoppingCart,
  Truck,
  Shield,
  Store,
  Clock,
  CheckCircle,
  MessageSquare,
  Filter,
  Grid,
  List
} from 'lucide-react';

interface Vendor {
  id: string;
  businessName: string;
  businessDescription: string | null;
  businessAddress: {
    street: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
  } | null;
  businessPhone: string | null;
  businessEmail: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  verificationStatus: string;
  rating: number;
  totalReviews: number;
  totalSales: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    products: number;
    vendorOrders: number;
    vendorReviews: number;
  };
}

interface VendorProduct {
  id: string;
  sku: string;
  costPrice: number | null;
  commissionRate: number | null;
  inventoryCount: number;
  approvalStatus: string;
  isFeatured: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    comparePrice: number | null;
    images: string[] | null;
    status: string;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export default function VendorStorefront() {
  const params = useParams();
  const vendorId = params?.id as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('created-desc');

  useEffect(() => {
    if (vendorId) {
      fetchVendorData();
      fetchVendorProducts();
    }
  }, [vendorId, sortBy]);

  const fetchVendorData = async () => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}`);
      if (response.ok) {
        const data = await response.json();
        setVendor(data.vendor);
      }
    } catch (error) {
      console.error('Failed to fetch vendor data:', error);
    }
  };

  const fetchVendorProducts = async () => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/products?sort=${sortBy}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to fetch vendor products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : i < rating
            ? 'text-yellow-200 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h2>
          <p className="text-gray-600">The vendor store you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div className="bg-white shadow-sm">
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          {vendor.bannerUrl && (
            <img
              src={vendor.bannerUrl}
              alt={`${vendor.businessName} banner`}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="container mx-auto px-4 -mt-16">
          <div className="flex items-end space-x-6">
            <div className="w-32 h-32 bg-white rounded-lg shadow-lg p-2">
              {vendor.logoUrl ? (
                <img
                  src={vendor.logoUrl}
                  alt={vendor.businessName}
                  className="w-full h-full object-contain rounded"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                  <Store className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{vendor.businessName}</h1>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center">
                      {renderStars(vendor.rating)}
                      <span className="ml-2 text-sm text-gray-600">
                        {vendor.rating.toFixed(1)} ({vendor.totalReviews} reviews)
                      </span>
                    </div>
                    <Badge className={getVerificationStatusColor(vendor.verificationStatus)}>
                      <Shield className="h-4 w-4 mr-1" />
                      {vendor.verificationStatus}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  <Button>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Visit Store
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Store Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.businessDescription && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">About</h4>
                    <p className="text-sm text-gray-600">{vendor.businessDescription}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {vendor.businessAddress && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-3" />
                      <div className="text-sm text-gray-600">
                        <p>{vendor.businessAddress.street}</p>
                        <p>
                          {vendor.businessAddress.city}, {vendor.businessAddress.province}
                        </p>
                        <p>{vendor.businessAddress.country}, {vendor.businessAddress.postalCode}</p>
                      </div>
                    </div>
                  )}
                  
                  {vendor.businessPhone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600">{vendor.businessPhone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">{vendor.businessEmail}</span>
                  </div>
                  
                  {vendor.websiteUrl && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-gray-400 mr-3" />
                      <a
                        href={vendor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Store Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Store Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Products</span>
                  </div>
                  <span className="font-medium">{vendor._count.products}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ShoppingCart className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Orders</span>
                  </div>
                  <span className="font-medium">{vendor._count.vendorOrders}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Reviews</span>
                  </div>
                  <span className="font-medium">{vendor._count.vendorReviews}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Member Since</span>
                  </div>
                  <span className="font-medium">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Products Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Products</h2>
                <p className="text-gray-600">
                  {products.length} products available
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created-desc">Newest First</option>
                  <option value="created-asc">Oldest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
                <div className="flex border border-gray-300 rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((vendorProduct) => (
                  <Card key={vendorProduct.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {vendorProduct.product.images && vendorProduct.product.images.length > 0 ? (
                        <img
                          src={vendorProduct.product.images[0]}
                          alt={vendorProduct.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      {vendorProduct.isFeatured && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary">Featured</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {vendorProduct.product.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {vendorProduct.product.category.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(vendorProduct.product.price)}
                            </p>
                            {vendorProduct.product.comparePrice && (
                              <p className="text-sm text-gray-500 line-through">
                                {formatCurrency(vendorProduct.product.comparePrice)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Stock: {vendorProduct.inventoryCount}
                            </p>
                          </div>
                        </div>
                        <Button className="w-full">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((vendorProduct) => (
                  <Card key={vendorProduct.id} className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0">
                        {vendorProduct.product.images && vendorProduct.product.images.length > 0 ? (
                          <img
                            src={vendorProduct.product.images[0]}
                            alt={vendorProduct.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {vendorProduct.product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {vendorProduct.product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(vendorProduct.product.price)}
                            </p>
                            {vendorProduct.product.comparePrice && (
                              <p className="text-sm text-gray-500 line-through">
                                {formatCurrency(vendorProduct.product.comparePrice)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                Stock: {vendorProduct.inventoryCount}
                              </p>
                              <p className="text-xs text-gray-500">
                                SKU: {vendorProduct.sku}
                              </p>
                            </div>
                            <Button>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {products.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Available</h3>
                    <p className="text-gray-600">
                      This vendor hasn't added any products yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
