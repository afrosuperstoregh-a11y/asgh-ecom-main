import { generateMetadata } from './metadata';
import ProductPage from './page';

export { generateMetadata };

export default async function ProductLayout({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductPage />;
}
