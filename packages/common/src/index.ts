// Shared types and constants for frontend + backend
// Currently empty - will add user roles, enums, etc.

/**
 * User Roles (shared between services)
 */
export enum UserRole {
  USER = 'USER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

/**
 * Auth Provider Types
 */
export enum AuthProvider {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
}
