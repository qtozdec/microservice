import React from 'react';
import { useTheme } from '../context/ThemeContext';

const SkeletonLoader = ({ 
  variant = 'text',
  width = '100%',
  height = '1rem',
  className = '',
  count = 1,
  animate = true
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses = `
    ${animate ? 'animate-pulse' : ''} 
    ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} 
    rounded
  `;

  const variants = {
    text: 'h-4',
    title: 'h-6',
    subtitle: 'h-5',
    paragraph: 'h-4',
    button: 'h-10',
    avatar: 'w-10 h-10 rounded-full',
    image: 'w-full h-48',
    card: 'w-full h-32',
    input: 'h-10',
    table: 'h-12',
    circle: 'rounded-full',
    rectangle: 'rounded-lg'
  };

  const getVariantClasses = () => {
    return variants[variant] || variants.text;
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  if (count === 1) {
    return (
      <div
        className={`${baseClasses} ${getVariantClasses()} ${className}`}
        style={style}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${getVariantClasses()} ${className}`}
          style={style}
        />
      ))}
    </div>
  );
};

// Preset skeleton components for common use cases
export const SkeletonCard = ({ animate = true }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start space-x-4">
        <SkeletonLoader variant="avatar" animate={animate} />
        <div className="flex-1 space-y-3">
          <SkeletonLoader variant="title" width="60%" animate={animate} />
          <SkeletonLoader variant="text" width="80%" animate={animate} />
          <SkeletonLoader variant="text" width="40%" animate={animate} />
        </div>
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4, animate = true }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <SkeletonLoader variant="text" width="200px" animate={animate} />
          <SkeletonLoader variant="button" width="100px" animate={animate} />
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {Array.from({ length: columns }, (_, index) => (
                <th key={index} className="px-4 py-3 text-left">
                  <SkeletonLoader variant="text" width="80px" animate={animate} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }, (_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <SkeletonLoader 
                      variant="text" 
                      width={colIndex === 0 ? "120px" : "80px"} 
                      animate={animate} 
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SkeletonList = ({ items = 5, animate = true }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3">
          <SkeletonLoader variant="avatar" animate={animate} />
          <div className="flex-1 space-y-2">
            <SkeletonLoader variant="text" width="70%" animate={animate} />
            <SkeletonLoader variant="text" width="50%" animate={animate} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonForm = ({ fields = 3, animate = true }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <SkeletonLoader variant="text" width="100px" animate={animate} />
          <SkeletonLoader variant="input" animate={animate} />
        </div>
      ))}
      <div className="flex justify-end space-x-3">
        <SkeletonLoader variant="button" width="80px" animate={animate} />
        <SkeletonLoader variant="button" width="80px" animate={animate} />
      </div>
    </div>
  );
};

export const SkeletonDashboard = ({ animate = true }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonLoader variant="title" width="200px" animate={animate} />
          <SkeletonLoader variant="text" width="300px" animate={animate} />
        </div>
        <SkeletonLoader variant="button" width="120px" animate={animate} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <SkeletonLoader variant="text" width="80px" animate={animate} />
                <SkeletonLoader variant="title" width="60px" animate={animate} />
              </div>
              <SkeletonLoader variant="circle" width="40px" height="40px" animate={animate} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <SkeletonLoader variant="title" width="150px" animate={animate} />
            </div>
            <SkeletonLoader variant="rectangle" height="300px" animate={animate} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <SkeletonLoader variant="title" width="120px" className="mb-4" animate={animate} />
            <SkeletonList items={3} animate={animate} />
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <SkeletonLoader variant="title" width="100px" className="mb-4" animate={animate} />
            <SkeletonLoader variant="rectangle" height="200px" animate={animate} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonUserProfile = ({ animate = true }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonLoader variant="circle" width="24px" height="24px" animate={animate} />
            <SkeletonLoader variant="title" width="150px" animate={animate} />
          </div>
          <SkeletonLoader variant="button" width="120px" animate={animate} />
        </div>
      </div>

      {/* Profile Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <div className="lg:col-span-1 text-center">
            <SkeletonLoader variant="circle" width="128px" height="128px" className="mx-auto mb-4" animate={animate} />
            <SkeletonLoader variant="title" width="120px" className="mx-auto mb-2" animate={animate} />
            <SkeletonLoader variant="text" width="80px" className="mx-auto" animate={animate} />
            
            <div className="mt-6 space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <SkeletonLoader variant="text" width="100%" animate={animate} />
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <SkeletonLoader variant="text" width="100%" animate={animate} />
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            <SkeletonForm fields={4} animate={animate} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;