import { Loader2 } from 'lucide-react';

// Skeleton loading components
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="animate-pulse">
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(columns)].map((_, colIndex) => (
                <div key={colIndex} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  {colIndex === 0 && (
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const CardSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

export const ListSkeleton = ({ items = 5 }: { items?: number }) => (
  <div className="animate-pulse space-y-4">
    {[...Array(items)].map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    ))}
  </div>
);

// Loading spinner component
export const LoadingSpinner = ({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-blue-600`} />
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  );
};

// Page loading component
export const PageLoading = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <LoadingSpinner size="lg" />
    <p className="mt-4 text-gray-600">{text}</p>
  </div>
);

// Button loading state
export const LoadingButton = ({ 
  children, 
  loading, 
  disabled, 
  className = '',
  ...props 
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center
      ${className}
      ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    {loading && <LoadingSpinner size="sm" />}
    {children}
  </button>
);

// Table loading overlay
export const TableLoadingOverlay = () => (
  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
    <LoadingSpinner size="lg" text="Loading data..." />
  </div>
);

// Card loading overlay
export const CardLoadingOverlay = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
    <div className="text-center">
      <LoadingSpinner size="md" />
      <p className="mt-2 text-sm text-gray-600">{text}</p>
    </div>
  </div>
);

// Progress bar for file uploads or long-running operations
export const ProgressBar = ({ 
  progress, 
  text, 
  showPercentage = true 
}: { 
  progress: number; 
  text?: string; 
  showPercentage?: boolean;
}) => (
  <div className="w-full">
    {text && (
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{text}</span>
        {showPercentage && <span>{Math.round(progress)}%</span>}
      </div>
    )}
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

// Empty state component
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: any;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="text-center py-12">
    <Icon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

// Error state component
export const ErrorState = ({ 
  title = 'Something went wrong', 
  description, 
  onRetry 
}: { 
  title?: string;
  description?: string;
  onRetry?: () => void;
}) => (
  <div className="text-center py-12">
    <div className="mx-auto h-12 w-12 text-red-500 rounded-full flex items-center justify-center">
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{description || 'Please try again later.'}</p>
    {onRetry && (
      <div className="mt-6">
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try again
        </button>
      </div>
    )}
  </div>
);
