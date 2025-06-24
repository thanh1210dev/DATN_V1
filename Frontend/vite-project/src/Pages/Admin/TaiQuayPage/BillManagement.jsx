import React from 'react';
import { HiOutlinePlus } from 'react-icons/hi';

const BillManagement = ({ bills, selectedBill, setSelectedBill, createBill, isLoading, pagination, handlePaginationChange }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 md:p-6 mb-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Danh Sách Hóa Đơn Chờ</h2>
        <button
          onClick={createBill}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          disabled={isLoading || bills.length >= 5}
          title={bills.length >= 5 ? 'Đã đạt tối đa 5 hóa đơn chờ xử lý' : ''}
        >
          <HiOutlinePlus className="mr-2" size={16} />
          Tạo Hóa Đơn
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {bills.map((bill) => (
          <button
            key={bill.id}
            onClick={() => setSelectedBill(bill)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedBill?.id === bill.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            #{bill.code} ({new Date(bill.createdAt).toLocaleTimeString()})
          </button>
        ))}
        {bills.length === 0 && <p className="text-gray-500 text-sm">Chưa có hóa đơn chờ xử lý</p>}
      </div>
      <div className="flex justify-end items-center gap-2">
        <button
          onClick={() => handlePaginationChange('bills', pagination.bills.page - 1)}
          disabled={pagination.bills.page === 0}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          ← Trước
        </button>
        <span className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm">
          Trang {pagination.bills.page + 1} / {pagination.bills.totalPages}
        </span>
        <button
          onClick={() => handlePaginationChange('bills', pagination.bills.page + 1)}
          disabled={pagination.bills.page + 1 >= pagination.bills.totalPages}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Tiếp →
        </button>
      </div>
    </div>
  );
};

export default BillManagement;


