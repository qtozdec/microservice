import React, { useState, useEffect, useCallback } from 'react';
import { orderService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  X, 
  AlertCircle,
  Filter,
  Search,
  MoreHorizontal
} from 'lucide-react';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    userId: '',
    product: '',
    quantity: 1,
    price: ''
  });

  const statusConfig = {
    PENDING: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: Clock,
      label: 'Pending'
    },
    CONFIRMED: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: CheckCircle,
      label: 'Confirmed'
    },
    SHIPPED: { 
      color: 'bg-purple-100 text-purple-800 border-purple-200', 
      icon: Truck,
      label: 'Shipped'
    },
    DELIVERED: { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: Package,
      label: 'Delivered'
    },
    CANCELLED: { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: X,
      label: 'Cancelled'
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!user?.userId) return;
    
    try {
      setLoading(true);
      setError('');
      let response;
      if (user.role === 'ADMIN') {
        response = await orderService.getOrders();
      } else {
        response = await orderService.getOrdersByUserId(user.userId);
      }
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user?.userId, user?.role]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await userService.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
      if (user.role === 'ADMIN') {
        fetchUsers();
      } else {
        setFormData(prev => ({ ...prev, userId: user.userId || '' }));
      }
    }
  }, [user?.userId, user?.role, fetchOrders, fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await orderService.createOrder({
        ...formData,
        userId: parseInt(formData.userId),
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price)
      });
      setFormData({ userId: user?.role === 'ADMIN' ? '' : user?.userId || '', product: '', quantity: 1, price: '' });
      setShowCreateForm(false);
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(orderId, { status });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const getUserName = (userId) => {
    if (user?.role === 'ADMIN') {
      const foundUser = users.find(u => u.id === userId);
      return foundUser ? foundUser.name : 'Unknown User';
    }
    return userId === user?.userId ? user.name : 'Unknown User';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getUserName(order.userId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusActions = (order) => {
    if (user?.role !== 'ADMIN') return [];
    
    const actions = [];
    switch (order.status) {
      case 'PENDING':
        actions.push({ status: 'CONFIRMED', label: 'Confirm', color: 'bg-blue-600 hover:bg-blue-700' });
        actions.push({ status: 'CANCELLED', label: 'Cancel', color: 'bg-red-600 hover:bg-red-700' });
        break;
      case 'CONFIRMED':
        actions.push({ status: 'SHIPPED', label: 'Ship', color: 'bg-purple-600 hover:bg-purple-700' });
        actions.push({ status: 'CANCELLED', label: 'Cancel', color: 'bg-red-600 hover:bg-red-700' });
        break;
      case 'SHIPPED':
        actions.push({ status: 'DELIVERED', label: 'Deliver', color: 'bg-green-600 hover:bg-green-700' });
        break;
    }
    return actions;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'ADMIN' ? 'Manage all orders in the system' : 'View and manage your orders'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {user?.role === 'ADMIN' && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status]?.icon || Package;
                  const statusActions = getStatusActions(order);
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id} - {order.product}
                          </div>
                          <div className="text-sm text-gray-500">
                            Qty: {order.quantity}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getUserName(order.userId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[order.status]?.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[order.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${order.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      {user?.role === 'ADMIN' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {statusActions.map((action, index) => (
                              <button
                                key={index}
                                onClick={() => updateOrderStatus(order.id, action.status)}
                                className={`px-3 py-1 text-xs font-medium text-white rounded-md transition duration-200 ${action.color}`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fadeIn">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create New Order</h3>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {user?.role === 'ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Customer</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <input
                  type="text"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Product name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;