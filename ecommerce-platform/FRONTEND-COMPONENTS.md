# Frontend Pages & Components - Authentication & User Accounts

## Page Structure

### Authentication Pages

#### `/auth/login` - Login Page
**File**: `app/auth/login/page.jsx`
**Purpose**: User authentication with email/password and social login options

**Components**:
- `LoginForm` - Main login form with validation
- `SocialLoginButtons` - Google, Apple, Facebook login buttons
- `RememberMeCheckbox` - Remember login preference
- `ForgotPasswordLink` - Link to password reset
- `SignupLink` - Link to registration page
- `Divider` - Visual separator between login methods
- `LoadingSpinner` - Loading state during authentication
- `ErrorMessage` - Display authentication errors
- `SuccessMessage` - Display success messages

**Features**:
- Form validation (email format, password requirements)
- Social login integration
- Remember me functionality
- Rate limiting feedback
- Redirect after successful login
- Password strength indicator

---

#### `/auth/register` - Registration Page
**File**: `app/auth/register/page.jsx`
**Purpose**: New user account creation

**Components**:
- `RegistrationForm` - Complete registration form
- `PasswordStrengthIndicator` - Real-time password strength
- `TermsCheckbox` - Terms and conditions acceptance
- `NewsletterCheckbox` - Optional newsletter subscription
- `SocialSignupButtons` - Social account registration
- `FormProgressIndicator` - Multi-step form progress
- `ValidationSummary` - Summary of validation errors

**Features**:
- Real-time field validation
- Password strength requirements
- Email confirmation simulation
- Social account linking
- GDPR compliance checkboxes
- Multi-step registration flow

---

#### `/auth/forgot-password` - Forgot Password Page
**File**: `app/auth/forgot-password/page.jsx`
**Purpose**: Initiate password reset process

**Components**:
- `ForgotPasswordForm` - Email input form
- `ConfirmationMessage` - Success message display
- `ResendLink` - Resend reset email option
- `BackToLoginLink` - Return to login

**Features**:
- Email validation
- Rate limiting feedback
- Success confirmation
- Resend option with timer

---

#### `/auth/reset-password` - Reset Password Page
**File**: `app/auth/reset-password/page.jsx`
**Purpose**: Set new password with reset token

**Components**:
- `ResetPasswordForm` - New password form
- `PasswordStrengthIndicator` - Password requirements
- `TokenValidation` - Token validity check
- `CountdownTimer` - Token expiration countdown

**Features**:
- Token validation
- Password strength requirements
- Confirmation password matching
- Token expiration handling

---

#### `/auth/verify-email` - Email Verification Page
**File**: `app/auth/verify-email/page.jsx`
**Purpose**: Email verification confirmation

**Components**:
- `VerificationStatus` - Success/error status
- `ResendVerificationButton` - Resend verification email
- `LoginRedirect` - Redirect to login after verification

---

### User Dashboard Pages

#### `/account` - Account Dashboard
**File**: `app/account/page.jsx`
**Purpose**: Main user account overview

**Components**:
- `DashboardLayout` - Account navigation layout
- `UserProfileCard` - User profile summary
- `QuickActions` - Quick access to common actions
- `RecentOrders` - Recent order history preview
- `AccountStats` - Account statistics (orders, wishlist items)
- `SecurityStatus` - Security overview
- `NavigationMenu` - Account section navigation

---

#### `/account/profile` - Profile Management
**File**: `app/account/profile/page.jsx`
**Purpose**: Edit user profile information

**Components**:
- `ProfileForm` - User information form
- `AvatarUpload` - Profile picture upload
- `PersonalInfoSection` - Name, email, phone fields
- `PreferencesSection` - Language, timezone settings
- `SecuritySection` - Password change, 2FA settings
- `DeleteAccountButton` - Account deletion option
- `FormValidation` - Real-time validation

**Features**:
- Profile picture upload with crop
- Email change verification
- Password change with current password
- 2FA enable/disable
- Account deletion with confirmation

---

#### `/account/addresses` - Address Book
**File**: `app/account/addresses/page.jsx`
**Purpose**: Manage shipping and billing addresses

**Components**:
- `AddressList` - List of saved addresses
- `AddressCard` - Individual address display
- `AddressForm` - Add/edit address form
- `DefaultAddressBadge` - Default address indicator
- `AddressActions` - Edit, delete, set default actions
- `AddressValidation` - Address format validation
- `GooglePlacesAutocomplete` - Address autocomplete

**Features**:
- Add/edit/delete addresses
- Set default shipping/billing
- Address validation
- Google Places integration
- Address type selection

---

#### `/account/orders` - Order History
**File**: `app/account/orders/page.jsx`
**Purpose**: View order history and details

**Components**:
- `OrderList` - Paginated order list
- `OrderCard` - Order summary card
- `OrderStatusBadge` - Order status indicator
- `OrderFilters` - Filter by status, date range
- `OrderSearch` - Search orders by number
- `Pagination` - Order list pagination
- `EmptyState` - No orders message

**Features**:
- Order status tracking
- Order search and filtering
- Pagination
- Order details modal
- Reorder functionality

---

#### `/account/orders/[id]` - Order Details
**File**: `app/account/orders/[id]/page.jsx`
**Purpose**: Detailed view of a single order

**Components**:
- `OrderHeader` - Order number, status, date
- `OrderItems` - List of ordered items
- `OrderTotals` - Cost breakdown
- `ShippingInfo` - Shipping details and tracking
- `PaymentInfo` - Payment method and status
- `OrderActions` - Cancel, return, reorder actions
- `Timeline` - Order status timeline

---

#### `/account/wishlist` - Wishlist
**File**: `app/account/wishlist/page.jsx`
**Purpose**: Manage wishlist items

**Components**:
- `WishlistGrid` - Grid of wishlist items
- `WishlistItem` - Individual product card
- `ProductCard` - Product information
- `WishlistActions` - Add to cart, remove from wishlist
- `WishlistFilters` - Sort and filter options
- `ShareWishlist` - Share wishlist functionality
- `EmptyWishlist` - Empty state message

**Features**:
- Add to cart from wishlist
- Remove items
- Share wishlist
- Sort by price, date added
- Product availability status

---

#### `/account/security` - Security Settings
**File**: `app/account/security/page.jsx`
**Purpose**: Manage account security settings

**Components**:
- `SecurityOverview` - Security status summary
- `PasswordSection` - Password change form
- `TwoFactorSection` - 2FA management
- `ActiveSessions` - List of active sessions
- `SessionItem` - Individual session details
- `RevokeSessionButton` - Revoke session access
- `LoginHistory` - Recent login attempts
- `SecurityTips` - Security recommendations

**Features**:
- Password change
- 2FA enable/disable
- Session management
- Login history
- Security score

---

## Shared Components

### Authentication Components

#### `components/auth/AuthLayout.jsx`
**Purpose**: Consistent layout for auth pages
**Features**: Logo, branding, footer links

#### `components/auth/FormInput.jsx`
**Purpose**: Reusable form input with validation
**Features**: Label, error message, icons, validation states

#### `components/auth/PasswordInput.jsx`
**Purpose**: Password input with show/hide toggle
**Features**: Strength indicator, requirements list

#### `components/auth/SocialLoginButton.jsx`
**Purpose**: Social login button (Google, Apple, etc.)
**Features**: Icon, branding, loading state

#### `components/auth/AuthGuard.jsx`
**Purpose**: Route protection component
**Features**: Redirect logic, loading states

#### `components/auth/GuestGuard.jsx`
**Purpose**: Prevent authenticated users from accessing auth pages

---

### User Account Components

#### `components/account/DashboardLayout.jsx`
**Purpose**: Account dashboard layout with navigation
**Features**: Sidebar navigation, mobile responsive

#### `components/account/ProfileAvatar.jsx`
**Purpose**: User avatar display and upload
**Features**: Upload, crop, preview, delete

#### `components/account/AddressForm.jsx`
**Purpose**: Address input form with validation
**Features**: Google Places, validation, type selection

#### `components/account/OrderStatusTracker.jsx`
**Purpose**: Visual order status tracking
**Features**: Timeline, status icons, progress bar

#### `components/account/WishlistButton.jsx`
**Purpose**: Add/remove from wishlist button
**Features**: Toggle state, loading, heart animation

---

### Form Components

#### `components/forms/ValidatedForm.jsx`
**Purpose**: Form with built-in validation
**Features**: Schema validation, error handling

#### `components/forms/FormField.jsx`
**Purpose**: Individual form field wrapper
**Features**: Label, input, error, help text

#### `components/forms/FormSelect.jsx`
**Purpose**: Select dropdown with search
**Features**: Search, multi-select, async options

#### `components/forms/FormTextarea.jsx`
**Purpose**: Textarea with character count
**Features**: Auto-resize, character limit

---

### UI Components

#### `components/ui/LoadingSpinner.jsx`
**Purpose**: Loading state indicator
**Features**: Different sizes, colors, overlay

#### `components/ui/Modal.jsx`
**Purpose**: Reusable modal component
**Features**: Close on overlay, escape key, animations

#### `components/ui/Toast.jsx`
**Purpose**: Notification toast messages
**Features**: Auto-dismiss, different types, positioning

#### `components/ui/Badge.jsx`
**Purpose**: Status and label badges
**Features**: Different colors, sizes, icons

#### `components/ui/Pagination.jsx`
**Purpose**: Pagination navigation
**Features**: Page numbers, next/prev, jump to page

---

### Utility Components

#### `components/utils/ErrorBoundary.jsx`
**Purpose**: Error boundary for component trees
**Features**: Fallback UI, error logging

#### `components/utils/ProtectedRoute.jsx`
**Purpose**: Route protection wrapper
**Features**: Authentication check, redirect logic

#### `components/utils/ClientOnly.jsx`
**Purpose**: Client-side only rendering
**Features**: SSR hydration handling

---

## Hooks

### Authentication Hooks

#### `hooks/useAuth.js`
**Purpose**: Authentication state management
**Features**: Login, logout, register, user state

#### `hooks/useAuthForm.js`
**Purpose**: Form validation for auth forms
**Features**: Validation, submission, error handling

#### `hooks/useSocialAuth.js`
**Purpose**: Social authentication logic
**Features**: OAuth flow, token handling

---

### User Account Hooks

#### `hooks/useProfile.js`
**Purpose**: User profile management
**Features**: Fetch, update, avatar upload

#### `hooks/useAddresses.js`
**Purpose**: Address book management
**Features**: CRUD operations, validation

#### `hooks/useOrders.js`
**Purpose**: Order history management
**Features**: Fetch, filter, pagination

#### `hooks/useWishlist.js`
**Purpose**: Wishlist management
**Features**: Add, remove, sync with cart

#### `hooks/useSecurity.js`
**Purpose**: Security settings management
**Features**: Password change, 2FA, sessions

---

## Services

### API Services

#### `services/authService.js`
**Purpose**: Authentication API calls
**Features**: Login, register, logout, token refresh

#### `services/userService.js`
**Purpose**: User profile API calls
**Features**: Profile CRUD, avatar upload

#### `services/addressService.js`
**Purpose**: Address management API calls
**Features**: Address CRUD, validation

#### `services/orderService.js`
**Purpose**: Order management API calls
**Features**: Order history, details, tracking

#### `services/wishlistService.js`
**Purpose**: Wishlist API calls
**Features**: Wishlist CRUD, sharing

---

## Utility Functions

### Validation

#### `utils/validation/authValidation.js`
**Purpose**: Authentication form validation schemas
**Features**: Email, password, registration validation

#### `utils/validation/addressValidation.js`
**Purpose**: Address form validation
**Features**: Address format, postal code validation

#### `utils/validation/profileValidation.js`
**Purpose**: Profile form validation
**Features**: Personal info, preferences validation

---

### Security

#### `utils/security/tokenManager.js`
**Purpose**: JWT token management
**Features**: Storage, refresh, expiration handling

#### `utils/security/csrfProtection.js`
**Purpose**: CSRF protection utilities
**Features**: Token generation, validation

#### `utils/security/passwordStrength.js`
**Purpose**: Password strength calculation
**Features**: Requirements check, scoring algorithm

---

### Helpers

#### `utils/helpers/formatHelpers.js`
**Purpose**: Data formatting utilities
**Features**: Currency, dates, phone numbers

#### `utils/helpers/storageHelpers.js`
**Purpose**: Local storage utilities
**Features**: Secure storage, expiration handling

#### `utils/helpers/apiHelpers.js`
**Purpose**: API request helpers
**Features**: Error handling, retry logic, caching

---

## State Management

### Context Providers

#### `context/AuthContext.jsx`
**Purpose**: Global authentication state
**Features**: User state, login/logout, token management

#### `context/UserContext.jsx`
**Purpose**: User profile state
**Features**: Profile data, loading states, updates

#### `context/WishlistContext.jsx`
**Purpose**: Wishlist state management
**Features**: Wishlist items, sync with backend

---

## Styling

### Component Styles

#### `styles/auth.css`
**Purpose**: Authentication page styles
**Features**: Form layouts, responsive design

#### `styles/account.css`
**Purpose**: Account dashboard styles
**Features**: Dashboard layout, navigation

#### `styles/forms.css`
**Purpose**: Form component styles
**Features**: Input styles, validation states

---

## Configuration

### Constants

#### `config/auth.js`
**Purpose**: Authentication configuration
**Features**: Token expiration, redirect URLs, social providers

#### `config/api.js`
**Purpose**: API configuration
**Features**: Endpoints, timeouts, retry logic

#### `config/validation.js`
**Purpose**: Validation rules
**Features**: Password requirements, field constraints

---

## Testing

### Component Tests

#### `__tests__/components/auth/`
**Purpose**: Authentication component tests
**Features**: Unit tests, integration tests

#### `__tests__/components/account/`
**Purpose**: Account component tests
**Features**: Dashboard, profile, orders tests

### Hook Tests

#### `__tests__/hooks/`
**Purpose**: Custom hook tests
**Features**: Auth, user, API hook tests

### Service Tests

#### `__tests__/services/`
**Purpose**: Service layer tests
**Features**: API service tests, mocking

---

## Performance Optimization

### Code Splitting

- Authentication pages: `app/auth/*/page.jsx`
- Account pages: `app/account/*/page.jsx`
- Components: Dynamic imports for heavy components

### Image Optimization

- Avatar upload with compression
- Product images with lazy loading
- WebP format support

### Caching

- API response caching
- Static asset caching
- Service worker for offline support

---

## Accessibility

### WCAG Compliance

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

### Features

- Focus management
- Skip navigation links
- Form error announcements
- Loading state announcements
- High contrast mode support
