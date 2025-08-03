/**
 * Các tiện ích cho thanh toán VNPay
 */

/**
 * Chuyển hướng sang trang thanh toán VNPay một cách an toàn
 * @param {string} paymentUrl - URL thanh toán VNPay
 */
export const redirectToVnpay = (paymentUrl) => {
  if (!paymentUrl) {
    console.error('Không có URL thanh toán');
    return false;
  }
  
  // Xử lý chuyển hướng an toàn
  try {
    console.log('Đang chuyển hướng đến:', paymentUrl);
    
    // Tạo một trang trung gian để tránh lỗi JS
    const redirectPage = window.open('', '_self');
    if (redirectPage) {
      redirectPage.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Đang chuyển hướng đến VNPay...</title>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                flex-direction: column;
                background-color: #f8f9fa;
              }
              .loader {
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .text {
                margin-top: 20px;
                font-size: 18px;
              }
            </style>
          </head>
          <body>
            <div class="loader"></div>
            <div class="text">Đang kết nối đến cổng thanh toán VNPay...</div>
            <script>
              // Chuyển hướng sau 1 giây
              setTimeout(function() {
                window.location.href = "${paymentUrl}";
              }, 1000);
            </script>
          </body>
        </html>
      `);
      redirectPage.document.close();
      return true;
    } else {
      // Fallback nếu không mở được trang mới
      window.location.href = paymentUrl;
      return true;
    }
  } catch (error) {
    console.error('Lỗi khi chuyển hướng:', error);
    // Fallback cuối cùng
    window.location.replace(paymentUrl);
    return false;
  }
};

/**
 * Xóa flag VNPAY processing khi cần thiết
 */
export const clearVnpayProcessing = () => {
  sessionStorage.removeItem('vnpayProcessing');
  sessionStorage.removeItem('vnpayBillId');
};

/**
 * Kiểm tra xem có đang trong quá trình thanh toán VNPAY không
 */
export const isVnpayProcessing = () => {
  return sessionStorage.getItem('vnpayProcessing') === 'true';
};

/**
 * Xử lý sự kiện đặt hàng an toàn
 * @param {Function} paymentHandler - Hàm xử lý thanh toán
 * @returns {Function} - Hàm xử lý sự kiện
 */
export const safePaymentHandler = (paymentHandler) => {
  return (e) => {
    // Ngăn chặn hành vi mặc định
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Xử lý an toàn className
    if (e && e.target) {
      // Đảm bảo className là string
      if (typeof e.target.className === 'object') {
        e.target.className = '';
      }
    }
    
    // Gọi handler gốc
    if (typeof paymentHandler === 'function') {
      return paymentHandler(e);
    }
  };
};
