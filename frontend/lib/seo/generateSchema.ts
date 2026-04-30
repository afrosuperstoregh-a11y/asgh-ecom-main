import siteConfig from './config';
import { Metadata } from 'next';

type SchemaType = 'website' | 'article' | 'product' | 'organization' | 'breadcrumb';

interface SchemaParams {
  type: SchemaType;
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  product?: {
    name: string;
    description?: string;
    image?: string;
    price?: string;
    priceCurrency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    rating?: {
      ratingValue: string;
      reviewCount: string;
    };
  };
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

export function generateSchema({
  type,
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author,
  product,
  breadcrumbs,
}: SchemaParams) {
  const baseUrl = siteConfig.siteUrl;
  const fullUrl = url ? new URL(url, baseUrl).toString() : baseUrl;
  const fullImage = image ? new URL(image, baseUrl).toString() : siteConfig.defaultImage;

  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': (type || '').charAt(0).toUpperCase() + (type || '').slice(1),
    name: title || siteConfig.title,
    description: description || siteConfig.description,
    url: fullUrl,
    image: fullImage,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      logo: {
        '@type': 'ImageObject',
        url: new URL(siteConfig.organization.logo, baseUrl).toString(),
      },
    },
  };

  // Add additional properties based on schema type
  switch (type) {
    case 'article':
      return {
        ...baseSchema,
        datePublished,
        dateModified,
        author: {
          '@type': 'Person',
          name: author || siteConfig.organization.name,
        },
        publisher: {
          '@type': 'Organization',
          name: siteConfig.organization.name,
          logo: {
            '@type': 'ImageObject',
            url: new URL(siteConfig.organization.logo, baseUrl).toString(),
          },
        },
      };

    case 'product':
      if (!product) return baseSchema;
      return {
        ...baseSchema,
        '@type': 'Product',
        name: product.name,
        image: product.image ? new URL(product.image, baseUrl).toString() : fullImage,
        description: product.description || description || siteConfig.description,
        brand: {
          '@type': 'Brand',
          name: siteConfig.organization.name,
        },
        ...(product.price && {
          offers: {
            '@type': 'Offer',
            url: fullUrl,
            priceCurrency: product.priceCurrency || 'USD',
            price: product.price,
            itemCondition: 'https://schema.org/NewCondition',
            availability: `https://schema.org/${product.availability || 'InStock'}`,
          },
        }),
        ...(product.rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating.ratingValue,
            reviewCount: product.rating.reviewCount,
          },
        }),
      };

    case 'organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteConfig.organization.name,
        url: siteConfig.organization.url,
        logo: new URL(siteConfig.organization.logo, baseUrl).toString(),
        sameAs: Object.values(siteConfig.socialLinks),
      };

    case 'breadcrumb':
      if (!breadcrumbs) return {};
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: new URL(item.url, baseUrl).toString(),
        })),
      };

    case 'website':
    default:
      return {
        ...baseSchema,
        '@type': 'WebSite',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      };
  }
}

// Helper function to generate metadata with schema
export function generateMetadataWithSchema(
  metadata: Metadata = {},
  schemaParams?: Omit<SchemaParams, 'type'> & { type?: SchemaType }
): Metadata {
  const type = schemaParams?.type || 'website';
  const schema = generateSchema({
    type,
    ...schemaParams,
  });

  // Convert the schema to a script tag string
  const schemaScript = JSON.stringify({
    '@context': 'https://schema.org',
    ...schema
  });

  return {
    ...metadata,
    other: {
      ...(metadata.other as Record<string, unknown> || {}),
      'application/ld+json': schemaScript,
    },
  };
}

export default generateSchema;