import AllProductsGrid from '@/components/AllProductsGrid';

export default function TestAllProductsPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test All Products (Should show 173)</h1>
      <AllProductsGrid />
    </div>
  );
}

export const metadata = {
  title: 'Test All Products - Afro Superstore',
  description: 'Test page to verify all 173 products are displayed',
};
