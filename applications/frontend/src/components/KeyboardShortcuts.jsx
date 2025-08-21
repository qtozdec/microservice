import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Keyboard,
  X,
  Search,
  Plus,
  RefreshCw,
  Download,
  Settings,
  User,
  Bell,
  LogOut,
  Command,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

const KeyboardShortcuts = ({ onClose, isOpen }) => {
  const { isDarkMode } = useTheme();

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Ctrl', 'K'], description: 'Open global search', icon: Search },
        { keys: ['G', 'H'], description: 'Go to dashboard', icon: null },
        { keys: ['G', 'U'], description: 'Go to users', icon: User },
        { keys: ['G', 'N'], description: 'Go to notifications', icon: Bell },
        { keys: ['G', 'S'], description: 'Go to settings', icon: Settings },
        { keys: ['?'], description: 'Show keyboard shortcuts', icon: Keyboard }
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: ['Ctrl', 'N'], description: 'Create new item', icon: Plus },
        { keys: ['Ctrl', 'R'], description: 'Refresh current page', icon: RefreshCw },
        { keys: ['Ctrl', 'E'], description: 'Export data', icon: Download },
        { keys: ['Ctrl', 'Shift', 'L'], description: 'Logout', icon: LogOut },
        { keys: ['Escape'], description: 'Close modal/dialog', icon: X }
      ]
    },
    {
      category: 'Table Navigation',
      items: [
        { keys: ['↑'], description: 'Select previous row', icon: ArrowUp },
        { keys: ['↓'], description: 'Select next row', icon: ArrowDown },
        { keys: ['Enter'], description: 'Open selected item', icon: null },
        { keys: ['Ctrl', 'A'], description: 'Select all items', icon: null },
        { keys: ['Delete'], description: 'Delete selected items', icon: null }
      ]
    },
    {
      category: 'General',
      items: [
        { keys: ['Ctrl', '/'], description: 'Toggle dark mode', icon: null },
        { keys: ['Ctrl', ','], description: 'Open preferences', icon: Settings },
        { keys: ['Alt', '←'], description: 'Go back', icon: ArrowLeft },
        { keys: ['Alt', '→'], description: 'Go forward', icon: ArrowRight }
      ]
    }
  ];

  const getKeyIcon = (key) => {
    const keyIcons = {
      'Command': Command,
      'Cmd': Command,
      '↑': ArrowUp,
      '↓': ArrowDown,
      '←': ArrowLeft,
      '→': ArrowRight
    };
    
    return keyIcons[key];
  };

  const renderKey = (key) => {
    const IconComponent = getKeyIcon(key);
    
    return (
      <kbd 
        key={key}
        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded shadow-sm"
      >
        {IconComponent ? (
          <IconComponent className="h-3 w-3" />
        ) : (
          key
        )}
      </kbd>
    );
  };

  const renderShortcut = (shortcut, index) => {
    const IconComponent = shortcut.icon;
    
    return (
      <div 
        key={index}
        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <div className="flex items-center space-x-3">
          {IconComponent && (
            <IconComponent className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {shortcut.description}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {shortcut.keys.map(renderKey)}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Keyboard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {shortcuts.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.items.map(renderShortcut)}
                </div>
              </div>
            ))}
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <Keyboard className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Pro Tip
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Press <kbd className="px-1 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 rounded">?</kbd> anywhere 
                  in the application to quickly access these shortcuts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Some shortcuts may vary depending on your operating system and browser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;