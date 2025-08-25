import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Search, 
  X, 
  User, 
  ShoppingCart, 
  Bell,
  Clock,
  TrendingUp,
  Hash,
  Mail,
  Calendar
} from 'lucide-react';
import { searchService } from '../services/searchService';

const GlobalSearch = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    users: [],
    orders: [],
    notifications: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const searchInputRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      loadRecentSearches();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      // Debounce search
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        performSearch(query.trim());
      }, 300);
    } else {
      setResults({ users: [], orders: [], notifications: [] });
    }

    return () => {
      clearTimeout(searchTimeout.current);
    };
  }, [query]);

  const loadRecentSearches = () => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      // Error loading recent searches
    }
  };

  const saveRecentSearch = (searchQuery) => {
    try {
      const updated = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery)
      ].slice(0, 5); // Keep only last 5 searches
      
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      // Error saving recent search
    }
  };

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const searchResults = await searchService.globalSearch(searchQuery);
      setResults(searchResults);
      saveRecentSearch(searchQuery);
    } catch (error) {
      setResults({ users: [], orders: [], notifications: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleRecentSearchClick = (recentQuery) => {
    setQuery(recentQuery);
    performSearch(recentQuery);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getTotalResults = () => {
    return (results?.users?.length || 0) + (results?.orders?.length || 0) + (results?.notifications?.length || 0);
  };

  const getTabResults = (tab) => {
    switch (tab) {
      case 'users': return results?.users?.length || 0;
      case 'orders': return results?.orders?.length || 0;
      case 'notifications': return results?.notifications?.length || 0;
      default: return getTotalResults();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      case 'failed': return 'text-red-600 dark:text-red-400';
      case 'processing': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const renderUserResult = (user) => (
    <div key={user.id} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors duration-200">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {user.name}
        </p>
        <div className="flex items-center mt-1">
          <Mail className="h-3 w-3 text-gray-400 mr-1" />
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
          {user.role}
        </span>
      </div>
    </div>
  );

  const renderOrderResult = (order) => (
    <div key={order.id} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors duration-200">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center">
          <Hash className="h-3 w-3 text-gray-400 mr-1" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Order {order.id}
          </p>
        </div>
        <div className="flex items-center mt-1">
          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(order.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          ${order.totalAmount}
        </p>
        <p className={`text-xs ${getStatusColor(order.status)}`}>
          {order.status}
        </p>
      </div>
    </div>
  );

  const renderNotificationResult = (notification) => (
    <div key={notification.id} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors duration-200">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
          <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {notification.message}
        </p>
        <div className="flex items-center mt-1">
          <Clock className="h-3 w-3 text-gray-400 mr-1" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(notification.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          notification.type === 'USER_EVENT' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
          notification.type === 'ORDER_EVENT' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
          'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
        }`}>
          {notification.type?.replace('_', ' ')}
        </span>
      </div>
    </div>
  );

  const renderResults = () => {
    const { users = [], orders = [], notifications = [] } = results;
    
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      );
    }

    if (!query.trim()) {
      return (
        <div className="py-4">
          {recentSearches.length > 0 && (
            <>
              <div className="flex items-center justify-between px-4 mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Searches</h3>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((recentQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(recentQuery)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      {recentQuery}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Start typing to search...</p>
          </div>
        </div>
      );
    }

    const totalResults = getTotalResults();
    
    if (totalResults === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No results found for "{query}"</p>
          <p className="text-sm mt-1">Try different keywords or check your spelling</p>
        </div>
      );
    }

    const shouldShow = (tab) => {
      if (activeTab === 'all') return true;
      return activeTab === tab;
    };

    return (
      <div className="space-y-4">
        {shouldShow('users') && users.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 px-4 mb-2">
              Users ({users.length})
            </h3>
            <div className="space-y-1">
              {users.map(renderUserResult)}
            </div>
          </div>
        )}

        {shouldShow('orders') && orders.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 px-4 mb-2">
              Orders ({orders.length})
            </h3>
            <div className="space-y-1">
              {orders.map(renderOrderResult)}
            </div>
          </div>
        )}

        {shouldShow('notifications') && notifications.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 px-4 mb-2">
              Notifications ({notifications.length})
            </h3>
            <div className="space-y-1">
              {notifications.map(renderNotificationResult)}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="fixed top-0 left-0 right-0 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-in">
            {/* Search Input */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users, orders, notifications..."
                  className="w-full pl-10 pr-10 py-3 text-lg bg-transparent border-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                  onClick={onClose}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            {query.trim() && getTotalResults() > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-700 px-4">
                <div className="flex space-x-1">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'users', label: 'Users' },
                    { key: 'orders', label: 'Orders' },
                    { key: 'notifications', label: 'Notifications' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                        activeTab === key
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {label} ({getTabResults(key)})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {renderResults()}
            </div>

            {/* Footer */}
            {query.trim() && getTotalResults() > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {getTotalResults()} result{getTotalResults() !== 1 ? 's' : ''} found
                </div>
                <div className="text-gray-400">
                  Press ESC to close
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;