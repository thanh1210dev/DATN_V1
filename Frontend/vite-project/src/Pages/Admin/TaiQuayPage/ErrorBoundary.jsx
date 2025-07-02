import React from 'react';
import { toast } from 'react-toastify';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    toast.error('Đã xảy ra lỗi trong giao diện. Vui lòng thử lại.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          <h2 className="text-lg font-semibold">Có lỗi xảy ra</h2>
          <p>Vui lòng làm mới trang hoặc liên hệ hỗ trợ.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


//Tạo hóa đơn