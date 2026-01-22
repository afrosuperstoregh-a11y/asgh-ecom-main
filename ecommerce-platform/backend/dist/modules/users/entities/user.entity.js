"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserRole = void 0;
const openapi = require("@nestjs/swagger");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MANAGER"] = "manager";
    UserRole["CUSTOMER"] = "customer";
    UserRole["GUEST"] = "guest";
})(UserRole || (exports.UserRole = UserRole = {}));
class User {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => Number }, email: { required: true, type: () => String }, password: { required: true, type: () => String }, role: { required: true, enum: require("./user.entity").UserRole } };
    }
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map