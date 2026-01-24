"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanadaPostError = void 0;
exports.handleCanadaPostError = handleCanadaPostError;
exports.calculatePackageDimensions = calculatePackageDimensions;
exports.calculateTotalWeight = calculateTotalWeight;
exports.formatAddress = formatAddress;
class CanadaPostError extends Error {
    constructor(code, details, message) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'CanadaPostError';
    }
}
exports.CanadaPostError = CanadaPostError;
function handleCanadaPostError(error, logger, context) {
    if (error.response) {
        const { status, data } = error.response;
        const errorData = data;
        logger.error(`Canada Post API Error${context ? ` (${context})` : ''}: ${status} - ${errorData?.message || 'Unknown error'}`, errorData?.details || error.stack);
        throw new CanadaPostError(status, errorData, errorData?.message || `Canada Post API Error: ${status}`);
    }
    logger.error(`Canada Post Request Failed${context ? ` (${context})` : ''}: ${error.message}`, error.stack);
    throw new CanadaPostError(error.code || 500, error, `Canada Post Request Failed: ${error.message}`);
}
function calculatePackageDimensions(items) {
    if (items.length === 0) {
        throw new Error('At least one item is required to calculate package dimensions');
    }
    if (items.length === 1) {
        return { ...items[0].dimensions };
    }
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;
    let totalVolume = 0;
    let maxVolume = 0;
    items.forEach(item => {
        const { length, width, height } = item.dimensions;
        const volume = length * width * height;
        maxLength = Math.max(maxLength, length, width, height);
        maxWidth = Math.max(maxWidth, Math.min(Math.max(length, width), Math.max(width, height)));
        totalHeight += Math.min(length, width, height);
        totalVolume += volume;
        maxVolume = Math.max(maxVolume, volume);
    });
    if (maxVolume / totalVolume > 0.7) {
        const largestItem = items.reduce((prev, current) => {
            const prevVolume = prev.dimensions.length * prev.dimensions.width * prev.dimensions.height;
            const currentVolume = current.dimensions.length * current.dimensions.width * current.dimensions.height;
            return (prevVolume > currentVolume) ? prev : current;
        });
        return { ...largestItem.dimensions };
    }
    const cubeRoot = Math.cbrt(totalVolume);
    const length = Math.ceil(cubeRoot);
    const width = Math.ceil(cubeRoot);
    const height = Math.ceil(totalVolume / (length * width));
    return {
        length: Math.max(length, maxLength),
        width: Math.max(width, maxWidth),
        height: Math.max(height, totalHeight / items.length),
    };
}
function calculateTotalWeight(items) {
    return items.reduce((total, item) => total + item.weight, 0);
}
function formatAddress(address) {
    const formattedPostalCode = address.postalCode.replace(/\s+/g, '').toUpperCase();
    const provinceCode = address.province.length > 2
        ? getProvinceCode(address.province, address.country)
        : address.province.toUpperCase();
    return {
        ...address,
        postalCode: formattedPostalCode,
        province: provinceCode,
        country: address.country.length > 2 ? getCountryCode(address.country) : address.country.toUpperCase(),
    };
}
function getProvinceCode(provinceName, countryCode) {
    const canadianProvinces = {
        'alberta': 'AB',
        'british columbia': 'BC',
        'manitoba': 'MB',
        'new brunswick': 'NB',
        'newfoundland and labrador': 'NL',
        'northwest territories': 'NT',
        'nova scotia': 'NS',
        'nunavut': 'NU',
        'ontario': 'ON',
        'prince edward island': 'PE',
        'quebec': 'QC',
        'saskatchewan': 'SK',
        'yukon': 'YT',
    };
    const usStates = {
        'alabama': 'AL',
        'alaska': 'AK',
    };
    const normalizedProvince = provinceName.toLowerCase().trim();
    if (countryCode.toUpperCase() === 'CA') {
        return canadianProvinces[normalizedProvince] || provinceName;
    }
    else if (countryCode.toUpperCase() === 'US') {
        return usStates[normalizedProvince] || provinceName;
    }
    return provinceName;
}
function getCountryCode(countryName) {
    const countryMap = {
        'canada': 'CA',
        'united states': 'US',
        'united states of america': 'US',
        'mexico': 'MX',
        'united kingdom': 'GB',
        'great britain': 'GB',
        'france': 'FR',
        'germany': 'DE',
        'japan': 'JP',
        'australia': 'AU',
    };
    return countryMap[countryName.toLowerCase()] || countryName;
}
//# sourceMappingURL=canada-post.utils.js.map