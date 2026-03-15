import { generateMetadata } from './metadata';
import ProductPage from './page';

export { generateMetadata };

export default function ProductLayout({ params }: { params: { id: string } }) {
  return <ProductPage />;
}
