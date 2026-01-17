"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANADA_POST_API_PATHS = exports.CANADA_POST_HTTP_SERVICE = exports.CANADA_POST_CONFIG_TOKEN = void 0;
exports.CANADA_POST_CONFIG_TOKEN = 'CANADA_POST_CONFIG';
exports.CANADA_POST_HTTP_SERVICE = 'CANADA_POST_HTTP_SERVICE';
exports.CANADA_POST_API_PATHS = {
    RATE: '/rs/ship/price',
    SHIPMENT: '/rs/{mailed-by}/shipment',
    TRACK: '/vis/track/pin/{tracking-pin}/summary',
    ARTIFACT: '/rs/artifact/{mailed-by}/{id}/{artifact}',
};
//# sourceMappingURL=canada-post.constants.js.map