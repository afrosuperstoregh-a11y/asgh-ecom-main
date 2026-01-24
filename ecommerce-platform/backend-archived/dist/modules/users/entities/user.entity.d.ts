export declare enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    CUSTOMER = "customer",
    GUEST = "guest"
}
export declare class User {
    id: number;
    email: string;
    password: string;
    role: UserRole;
}
