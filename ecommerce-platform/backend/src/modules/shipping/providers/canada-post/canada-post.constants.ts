// canada-post.constants.ts
export const CANADA_POST_CONFIG_TOKEN = 'CANADA_POST_CONFIG';
export const CANADA_POST_HTTP_SERVICE = 'CANADA_POST_HTTP_SERVICE';

export const CANADA_POST_API_PATHS = {
  RATE: '/rs/ship/price',
  SHIPMENT: '/rs/{mailed-by}/shipment',
  TRACK: '/vis/track/pin/{tracking-pin}/summary',
  ARTIFACT: '/rs/artifact/{mailed-by}/{id}/{artifact}',
};