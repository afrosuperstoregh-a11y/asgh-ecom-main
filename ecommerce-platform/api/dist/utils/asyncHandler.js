"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = exports.asyncHandler = void 0;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const catchAsync = (fn) => (0, exports.asyncHandler)(fn);
exports.catchAsync = catchAsync;
