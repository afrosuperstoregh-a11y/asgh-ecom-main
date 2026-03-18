interface SocialLinks {
  twitter: string;
  facebook: string;
  instagram: string;
  linkedin: string;
}

interface Organization {
  name: string;
  url: string;
  logo: string;
}

interface SiteConfig {
  title: string;
  titleTemplate: string;
  description: string;
  siteUrl: string;
  siteName: string;
  twitterHandle: string;
  defaultImage: string;
  defaultImageAlt: string;
  defaultImageType: string;
  defaultImageWidth: string;
  defaultImageHeight: string;
  locale: string;
  themeColor: string;
  keywords: string[];
  organization: Organization;
  socialLinks: SocialLinks;
}

const siteConfig: SiteConfig = {
  title: 'E-Commerce Store',
  titleTemplate: '%s | E-Commerce Store',
  description: 'Your one-stop shop for amazing products at great prices',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  siteName: 'E-Commerce Store',
  twitterHandle: '@ecommercestore',
  defaultImage: '/images/og-image.jpg',
  defaultImageAlt: 'E-Commerce Store - Shop Now',
  defaultImageType: 'image/jpeg',
  defaultImageWidth: '1200',
  defaultImageHeight: '630',
  locale: 'en_US',
  themeColor: '#ffffff',
  keywords: [
    'ecommerce', 
    'online shopping', 
    'buy online', 
    'fashion', 
    'electronics', 
    'home goods',
    'shop',
    'online store'
  ],
  organization: {
    name: 'E-Commerce Store',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/logo.png`,
  },
  socialLinks: {
    twitter: 'https://twitter.com/ecommercestore',
    facebook: 'https://facebook.com/ecommercestore',
    instagram: 'https://instagram.com/ecommercestore',
    linkedin: 'https://linkedin.com/company/ecommercestore'
  }
};

export default siteConfig;
