import React, { useState } from 'react';
import { updateOrderStatus } from '../../services/orderService';
import Alert from '../common/Alert';

const OrderStatusUpdater = ({ orderId, currentStatus, onStatusUpdate }) => {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleStatusChange = async () => {
    if (status === currentStatus) return;
    
    setIsUpdating(true);
    setMessage({ type: '', text: '' });
    
    try {
      const result = await updateOrderStatus(orderId, status);
      setMessage({ 
        type: 'success', 
        text: `Order status updated to ${status}` 
      });
      if (onStatusUpdate) {
        onStatusUpdate(result.data);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.error || 'Failed to update order status' 
      });
      setStatus(currentStatus); // Reset to current status on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Update Order Status</h3>
      
      {message.text && (
        <Alert
          type={message.type}
          message={message.text}
          onClose={() => setMessage({ type: '', text: '' })}
        />
      )}
      
      <div className="flex items-center space-x-4">
        <div className="w-1/2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isUpdating}
          >
            <option value="Pending">Pending</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
        
        <button
          onClick={handleStatusChange}
          disabled={status === currentStatus || isUpdating}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isUpdating ? 'Updating...' : 'Update Status'}
        </button>
      </div>
    </div>
  );
};

export default OrderStatusUpdater;
