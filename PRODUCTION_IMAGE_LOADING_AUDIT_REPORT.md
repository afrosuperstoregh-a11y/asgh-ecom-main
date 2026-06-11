# Production Image Loading Audit Report

**Date**: June 10, 2026  
**Status**: ✅ **ISSUE IDENTIFIED AND FIXED**

---

## Executive Summary

**Issue**: Images failing to load on frontend in production due to URL encoding regression in image utility functions.

**Root Cause**: The `encodePathComponents` function in both `shared/lib/image-utils.ts` and `frontend/lib/server-images.ts` was deliberately decoding `%26` back to `&`, undoing the previous URL encoding fixes. This caused browsers to interpret `&` as a query parameter separator, resulting in HTTP 400 errors.

**Impact**: All product images with special characters in paths (e.g., `food&beverages`, `beauty&health`) were failing to load.

**Resolution**: Removed the `.replace(/%26/g, '&')` line from both image utility files to preserve proper URL encoding.

---

## Investigation Findings

### 1. Database State ✅

- **Status**: Correctly configured
- **Finding**: Image URLs in database are properly encoded (e.g., `food%26beverages` instead of `food&beverages`)
- **Evidence**: 
  ```json
  {
    "name": "Different Stew Party Orders 2",
    "images": [
      "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/different-stew-party-orders-2.jpg"
    ]
  }
  ```
- **Conclusion**: Database encoding is correct and matches the fixes documented in `IMAGE_400_ERROR_FIX_REPORT.md`

### 2. Image Utility Functions ❌

**Files Affected**:
- `shared/lib/image-utils.ts` (line 67)
- `frontend/lib/server-images.ts` (line 67)

**Problematic Code** (BEFORE FIX):
```typescript
function encodePathComponents(path: string): string {
  return path.split('/').map(segment => {
    return encodeURIComponent(segment)
      .replace(/%26/g, '&')  // ❌ PROBLEM: Decodes %26 back to &
      .replace(/%2F/g, '/')
      .replace(/%3F/g, '?')
      .replace(/%23/g, '#');
  }).join('/');
}
```

**Issue**: The function was deliberately decoding `%26` back to `&`, which:
1. Undoes the URL encoding that was applied to fix the original issue
2. Causes browsers to interpret `&` as a query parameter separator
3. Results in malformed URLs and HTTP 400 errors

**Example**:
- Database: `food%26beverages/banku-mix.png` (correct)
- After utility: `food&beverages/banku-mix.png` (incorrect)
- Browser interprets as: `food` with query param `beverages/banku-mix.png`
- Result: HTTP 400 Bad Request

### 3. Frontend Components ✅

**Status**: Correctly implemented
- `ImageWithFallback.tsx` uses centralized image utilities
- `ProductCard.tsx` uses `getProductImageUrl()` helper
- All components have proper error handling and fallbacks
- No issues found in component implementation

### 4. Backend API ✅

**Status**: Correctly implemented
- `productController.ts` delegates to `productService`
- API returns image URLs as stored in database
- No URL manipulation in backend layer
- No issues found in backend implementation

### 5. Additional Issue Found ⚠️

**Product**: B&Mproduct1
**Issue**: Images field was a string instead of an array
**Impact**: Would cause `forEach is not a function` errors
**Status**: ✅ Fixed - converted to array format

---

## Root Cause Analysis

### The Regression

The `IMAGE_400_ERROR_FIX_REPORT.md` from January 2025 documented that:
- Original issue: Unencoded `&` characters causing 400 errors
- Fix applied: Encode `&` as `%26` in database URLs
- Status: Marked as "COMPLETE"

However, the image utility functions were updated with code that deliberately undoes this fix:
```typescript
.replace(/%26/g, '&')  // Preserve &
```

This created a regression where:
1. Database stores correctly encoded URLs (`food%26beverages`)
2. Image utilities decode them back to unencoded (`food&beverages`)
3. Browsers fail to load images with 400 errors

### Why This Happened

The code comment suggested this was intentional:
```typescript
// Preserve special characters like & that are valid in Supabase Storage paths
```

However, this logic is flawed because:
- While Supabase Storage accepts both encoded and unencoded paths
- Browsers require proper URL encoding to avoid interpreting `&` as a query separator
- The previous fix correctly identified that encoding is necessary for browser compatibility

---

## Fixes Applied

### 1. Image Utility Encoding Fix ✅

**File**: `shared/lib/image-utils.ts`
**Change**: Removed `.replace(/%26/g, '&')` from `encodePathComponents` function

**Before**:
```typescript
return encodeURIComponent(segment)
  .replace(/%26/g, '&')  // Preserve &
  .replace(/%2F/g, '/')
  .replace(/%3F/g, '?')
  .replace(/%23/g, '#');
```

**After**:
```typescript
return encodeURIComponent(segment)
  .replace(/%2F/g, '/')  // Preserve / (path separator)
  .replace(/%3F/g, '?')  // Preserve ? (if needed)
  .replace(/%23/g, '#'); // Preserve # (if needed)
  // Removed: .replace(/%26/g, '&') - this was causing 400 errors
```

**File**: `frontend/lib/server-images.ts`
**Change**: Same fix applied to maintain consistency

### 2. B&Mproduct1 Data Fix ✅

**Script**: `fix-bmproduct1-images.cjs`
**Change**: Converted images field from string to array

**Before**:
```json
{
  "name": "B&Mproduct1",
  "images": "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/books%26media/b%26mproduct1.jpg"
}
```

**After**:
```json
{
  "name": "B&Mproduct1",
  "images": [
    "https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/books%26media/b%26mproduct1.jpg"
  ]
}
```

---

## Verification Steps

### Manual Verification Required

After deployment to production, verify:

1. **Image Loading**: Check browser console for 400 errors on image loads
2. **Product Pages**: Navigate to product pages and verify images display
3. **Category Pages**: Check category pages with special characters (food & beverages, beauty & health)
4. **Fallback Images**: Verify placeholder images show when actual images fail
5. **Network Tab**: Inspect network requests to confirm URLs are properly encoded

### Expected Behavior

**Before Fix**:
- URL: `https://.../product-images/food&beverages/banku-mix.png`
- Browser interprets: `food` with query param `beverages/banku-mix.png`
- Result: HTTP 400 Bad Request

**After Fix**:
- URL: `https://.../product-images/food%26beverages/banku-mix.png`
- Browser interprets: Correct path with encoded ampersand
- Result: HTTP 200 OK, image loads successfully

---

## Files Modified

1. `shared/lib/image-utils.ts` - Fixed `encodePathComponents` function
2. `frontend/lib/server-images.ts` - Fixed `encodePathComponents` function
3. `fix-bmproduct1-images.cjs` - New script to fix malformed data (already executed)

---

## Recommendations

### Immediate Actions

1. **Deploy to Production**: Deploy the fixed image utility files
2. **Clear CDN Cache**: Clear any CDN caches to ensure updated code is served
3. **Monitor Logs**: Monitor production logs for any remaining image loading errors

### Long-term Improvements

1. **Add URL Validation**: Add validation to prevent malformed image data (strings instead of arrays)
2. **Add Integration Tests**: Add tests to verify URL encoding behavior
3. **Consolidate Utilities**: Consider consolidating image utilities to prevent inconsistencies
4. **Add Monitoring**: Add logging to track image loading failures in production

---

## Conclusion

The image loading failure in production was caused by a regression in the image utility functions that undid previous URL encoding fixes. The issue has been identified and fixed by removing the problematic `.replace(/%26/g, '&')` line from both `shared/lib/image-utils.ts` and `frontend/lib/server-images.ts`.

Additionally, a data integrity issue with B&Mproduct1 was fixed by converting the images field from a string to an array.

After deploying these fixes, images should load correctly in production without HTTP 400 errors.
