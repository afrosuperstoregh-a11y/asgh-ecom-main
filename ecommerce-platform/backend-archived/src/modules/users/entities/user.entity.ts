export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CUSTOMER = 'customer',
  GUEST = 'guest'
  // Add other roles as needed
}

export class User {
  id: number;
  email: string;
  password: string;
  role: UserRole;
  // Add other user properties as needed
}
