import axiosInstance from '../axiosInstance';

const ThongKeService = {
  // Thống kê doanh thu theo thời gian
  layDoanhThuTheoThoiGian: async (yeuCau) => {
      // eslint-disable-next-line no-useless-catch
    try {
      const response = await axiosInstance.post('/thong-ke/doanh-thu/theo-thoi-gian', yeuCau);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Thống kê doanh thu hôm nay
  layDoanhThuHomNay: async () => {
      // eslint-disable-next-line no-useless-catch
    try {
      const response = await axiosInstance.get('/thong-ke/doanh-thu/hom-nay');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // So sánh doanh thu
  soSanhDoanhThu: async (ky) => {
      // eslint-disable-next-line no-useless-catch
    try {
      const response = await axiosInstance.get(`/thong-ke/doanh-thu/so-sanh?ky=${ky}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Sản phẩm bán chạy
  laySanPhamBanChay: async (top, ngayBatDau, ngayKetThuc) => {
      // eslint-disable-next-line no-useless-catch
    try {
      const response = await axiosInstance.get(
        `/thong-ke/san-pham/ban-chay?top=${top}&ngayBatDau=${ngayBatDau}&ngayKetThuc=${ngayKetThuc}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Sản phẩm tồn kho thấp
  laySanPhamTonKhoThap: async (nguongToiThieu) => {
      // eslint-disable-next-line no-useless-catch
    try {
      const response = await axiosInstance.get(`/thong-ke/san-pham/ton-kho-thap?nguongToiThieu=${nguongToiThieu}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Sản phẩm tồn kho lâu
  laySanPhamTonKhoLau: async (soNgay) => {
      // eslint-disable-next-line no-useless-catch
    try {
      const response = await axiosInstance.get(`/thong-ke/san-pham/ton-kho-lau?soNgay=${soNgay}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Thống kê khách hàng thân thiết
  layKhachHangThanThiet: async (top, ngayBatDau, ngayKetThuc) => {
      // eslint-disable-next-line no-useless-catch
    try {
      const response = await axiosInstance.get(
        `/thong-ke/doanh-thu/khach-hang-than-thiet?top=${top}&ngayBatDau=${ngayBatDau}&ngayKetThuc=${ngayKetThuc}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Thống kê phương thức thanh toán
  layPhuongThucThanhToan: async () => {
      // eslint-disable-next-line no-useless-catch
    try {
      const response = await axiosInstance.get('/thong-ke/doanh-thu/phuong-thuc-thanh-toan');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Thống kê khuyến mãi
  layKhuyenMai: async (ngayBatDau, ngayKetThuc) => {
      // eslint-disable-next-line no-useless-catch
    try {
      const response = await axiosInstance.get(
        `/thong-ke/doanh-thu/khuyen-mai?ngayBatDau=${ngayBatDau}&ngayKetThuc=${ngayKetThuc}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Thống kê đơn hàng theo trạng thái
  layDonHangTheoTrangThai: async () => {
      // eslint-disable-next-line no-useless-catch
    try {
      const response = await axiosInstance.get('/thong-ke/doanh-thu/don-hang-trang-thai');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Thống kê đơn hàng theo thời gian
  layDonHangTheoThoiGian: async (ngayBatDau, ngayKetThuc) => {
    
    // eslint-disable-next-line no-useless-catch
    try {
      const response = await axiosInstance.get(
        `/thong-ke/doanh-thu/don-hang-thoi-gian?ngayBatDau=${ngayBatDau}&ngayKetThuc=${ngayKetThuc}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default ThongKeService;