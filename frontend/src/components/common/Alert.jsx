import React from 'react';

const Alert = ({ type = 'info', message, onClose }) => {
  const types = {
    success: 'bg-green-100 border-green-500 text-green-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700'
  };

  return (
    <div className={`border-l-4 p-4 mb-4 ${types[type]}`}>
      <div className="flex items-center justify-between">
        <p>{message}</p>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
