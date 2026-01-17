import Head from 'next/head';
import { ANALYTICS_CONFIG } from '@/config/analytics';

/**
 * Component that adds Google Search Console verification meta tag
 * This should be placed in your _app.tsx or layout file
 */
export const SearchConsoleVerification = () => {
  const { GOOGLE_SITE_VERIFICATION } = ANALYTICS_CONFIG;
  
  if (!GOOGLE_SITE_VERIFICATION) {
    console.warn('Google Search Console verification code is not set in environment variables');
    return null;
  }

  return (
    <Head>
      <meta 
        name="google-site-verification" 
        content={GOOGLE_SITE_VERIFICATION} 
        key="google-site-verification"
      />
    </Head>
  );
};

export default SearchConsoleVerification;
