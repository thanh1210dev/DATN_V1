
import React, { useState, useEffect } from 'react';
import { Tabs, DatePicker, Select, Table, Card, Row, Col, message } from 'antd';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PieController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import moment from 'moment-timezone';
import ThongKeService from '../../../Service/AdminThongKe/ThongKeService';

ChartJS.register(CategoryScale, LinearScale, BarElement, PieController, ArcElement, Title, Tooltip, Legend);

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ThongKeAdmin = () => {
  const [activeTab, setActiveTab] = useState('doanh-thu');
  const [doanhThuData, setDoanhThuData] = useState([]);
  const [doanhThuHomNay, setDoanhThuHomNay] = useState(null);
  const [soSanhData, setSoSanhData] = useState([]);
  const [sanPhamBanChay, setSanPhamBanChay] = useState([]);
  const [sanPhamTonKhoThap, setSanPhamTonKhoThap] = useState([]);
  const [sanPhamTonKhoLau, setSanPhamTonKhoLau] = useState([]);
  const [khachHangThanThiet, setKhachHangThanThiet] = useState([]);
  const [phuongThucThanhToan, setPhuongThucThanhToan] = useState([]);
  const [khuyenMai, setKhuyenMai] = useState([]);
  const [donHangTheoTrangThai, setDonHangTheoTrangThai] = useState([]);
  const [donHangTheoThoiGian, setDonHangTheoThoiGian] = useState([]);
  const [nhanVienBanHang, setNhanVienBanHang] = useState([]);
  const [donViThoiGian, setDonViThoiGian] = useState('NGAY');
  const [billType, setBillType] = useState(null);
  const [kySoSanh, setKySoSanh] = useState('THANG');
  const [topSanPham, setTopSanPham] = useState(5);
  const [nguongTonKho, setNguongTonKho] = useState(10);
  const [soNgayTonKhoLau, setSoNgayTonKhoLau] = useState(30);

  // Separate date ranges for each section
  const [datePhuongThuc, setDatePhuongThuc] = useState([moment().subtract(7, 'days'), moment()]);
  const [dateKhuyenMai, setDateKhuyenMai] = useState([moment().subtract(7, 'days'), moment()]);
  const [dateDonHangTrangThai, setDateDonHangTrangThai] = useState([moment().subtract(7, 'days'), moment()]);
  const [dateDonHangThoiGian, setDateDonHangThoiGian] = useState([moment().subtract(7, 'days'), moment()]);
  const [dateKhachHang, setDateKhachHang] = useState([moment().subtract(7, 'days'), moment()]);
  const [dateNhanVien, setDateNhanVien] = useState([moment().subtract(7, 'days'), moment()]);
  const [dateDoanhThu, setDateDoanhThu] = useState([moment().subtract(7, 'days'), moment()]);
  const [dateSanPham, setDateSanPham] = useState([moment().subtract(7, 'days'), moment()]);

  // Status translations
  const statusTranslations = {
    PENDING: 'Chờ Thanh Toán',
    CONFIRMING: 'Đang Xác Nhận',
    PAID: 'Đã Thanh Toán',
    DELIVERING: 'Đang Giao Hàng',
    COMPLETED: 'Hoàn Thành',
    CANCELLED: 'Đã Hủy',
    RETURNED: 'Đã Trả Hàng',
    REFUNDED: 'Đã Hoàn Tiền',
  PARTIALLY_REFUNDED: 'Hoàn Tiền Một Phần',
    RETURN_COMPLETED: 'Hoàn Trả Hoàn Tất',
  };

  // Member tier translations with colors
  const memberTierTranslations = {
    BRONZE: { text: 'Đồng', color: '#CD7F32' },
    SILVER: { text: 'Bạc', color: '#C0C0C0' },
    GOLD: { text: 'Vàng', color: '#FFD700' },
    PLATINUM: { text: 'Bạch Kim', color: '#E5E4E2' },
  };

  // Format date to LocalDateTime string for backend (yyyy-MM-dd HH:mm:ss)
  const formatToLocalDateTime = (date) =>
    date ? moment(date).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss') : null;

  // Format date to Instant for backend (ISO 8601)
  const formatToInstant = (date) =>
    date ? moment(date).tz('Asia/Ho_Chi_Minh').toISOString() : null;

  // Calculate total revenue for filtered period
  const totalDoanhThu = doanhThuData.reduce((sum, item) => sum + (item.tongDoanhThu || 0), 0);

  // Handle time unit change and adjust date range
  const handleDonViThoiGianChange = (value) => {
    setDonViThoiGian(value);
    let start, end;
    switch (value) {
      case 'THANG':
        start = moment().startOf('month');
        end = moment().endOf('month');
        break;
      case 'QUY':
        start = moment().startOf('quarter');
        end = moment().endOf('quarter');
        break;
      case 'NAM':
        start = moment().startOf('year');
        end = moment().endOf('year');
        break;
      case 'TUAN':
        start = moment().startOf('week');
        end = moment().endOf('week');
        break;
      default: // NGAY
        start = moment().subtract(7, 'days');
        end = moment();
    }
    setDateDoanhThu([start, end]);
  };

  // Handle comparison period change
  const handleKySoSanhChange = (value) => {
    setKySoSanh(value);
  };

  // Fetch revenue data
  useEffect(() => {
    const fetchDoanhThu = async () => {
      try {
        const yeuCau = {
          donViThoiGian,
          ngayBatDau: formatToLocalDateTime(dateDoanhThu[0]),
          ngayKetThuc: formatToLocalDateTime(moment(dateDoanhThu[1]).endOf('day')),
          billType,
        };
        console.log('Sending request to /theo-thoi-gian with:', yeuCau);
        const data = await ThongKeService.layDoanhThuTheoThoiGian(yeuCau);
        const parsedData = data.map((item) => ({
          ...item,
          ngay: moment.tz(item.ngay, 'Asia/Ho_Chi_Minh').toDate(),
        }));
        setDoanhThuData(parsedData);
      } catch (error) {
        console.error('Lỗi lấy dữ liệu doanh thu:', error);
        message.error('Không thể tải dữ liệu doanh thu.');
      }
    };

    const fetchDoanhThuHomNay = async () => {
      try {
        const data = await ThongKeService.layDoanhThuHomNay();
        if (data.ngay) {
          data.ngay = moment.tz(data.ngay, 'Asia/Ho_Chi_Minh').toDate();
        }
        setDoanhThuHomNay(data);
      } catch (error) {
        console.error('Lỗi lấy doanh thu hôm nay:', error);
        message.error('Không thể tải doanh thu hôm nay.');
      }
    };

    const fetchSoSanhDoanhThu = async () => {
      try {
        console.log('Sending request to /so-sanh with ky:', kySoSanh);
        const data = await ThongKeService.soSanhDoanhThu(kySoSanh);
        setSoSanhData(data);
      } catch (error) {
        console.error('Lỗi so sánh doanh thu:', error);
        message.error('Không thể tải dữ liệu so sánh doanh thu.');
      }
    };

    if (activeTab === 'doanh-thu') {
      fetchDoanhThu();
      fetchDoanhThuHomNay();
      fetchSoSanhDoanhThu();
    }
  }, [activeTab, donViThoiGian, dateDoanhThu, kySoSanh, billType]);

  // Fetch product data
  useEffect(() => {
    const fetchSanPhamBanChay = async () => {
      try {
        const params = {
          top: topSanPham,
          ngayBatDau: formatToInstant(dateSanPham[0]),
          ngayKetThuc: formatToInstant(moment(dateSanPham[1]).endOf('day')),
        };
        console.log('Sending request to /san-pham-ban-chay with:', params);
        const data = await ThongKeService.laySanPhamBanChay(
          params.top,
          params.ngayBatDau,
          params.ngayKetThuc
        );
        const dataWithUniqueKeys = data.map((item, index) => ({
          ...item,
          uniqueKey: `${item.maSanPham}-${item.mauSac || 'default'}-${item.kichCo || 'default'}-${index}`,
        }));
        setSanPhamBanChay(dataWithUniqueKeys);
      } catch (error) {
        console.error('Lỗi lấy sản phẩm bán chạy:', error);
        message.error('Không thể tải dữ liệu sản phẩm bán chạy.');
      }
    };

    const fetchSanPhamTonKhoThap = async () => {
      try {
        console.log('Sending request to /san-pham-ton-kho-thap with nguongTonKho:', nguongTonKho);
        const data = await ThongKeService.laySanPhamTonKhoThap(nguongTonKho);
        const dataWithUniqueKeys = data.map((item, index) => ({
          ...item,
          uniqueKey: `${item.maSanPham}-${item.mauSac || 'default'}-${item.kichCo || 'default'}-${index}`,
        }));
        setSanPhamTonKhoThap(dataWithUniqueKeys);
      } catch (error) {
        console.error('Lỗi lấy sản phẩm tồn kho thấp:', error);
        message.error('Không thể tải dữ liệu sản phẩm tồn kho thấp.');
      }
    };

    const fetchSanPhamTonKhoLau = async () => {
      try {
        console.log('Sending request to /san-pham-ton-kho-lau with soNgayTonKhoLau:', soNgayTonKhoLau);
        const data = await ThongKeService.laySanPhamTonKhoLau(soNgayTonKhoLau);
        const parsedData = data.map((item, index) => ({
          ...item,
          ngayCapNhatCuoi: item.ngayCapNhatCuoi
            ? moment.tz(item.ngayCapNhatCuoi, 'Asia/Ho_Chi_Minh').toDate()
            : null,
          uniqueKey: `${item.maSanPham}-${item.mauSac || 'default'}-${item.kichCo || 'default'}-${index}`,
        }));
        setSanPhamTonKhoLau(parsedData);
      } catch (error) {
        console.error('Lỗi lấy sản phẩm tồn kho lâu:', error);
        message.error('Không thể tải dữ liệu sản phẩm tồn kho lâu.');
      }
    };

    if (activeTab === 'san-pham') {
      fetchSanPhamBanChay();
      fetchSanPhamTonKhoThap();
      fetchSanPhamTonKhoLau();
    }
  }, [activeTab, topSanPham, dateSanPham, nguongTonKho, soNgayTonKhoLau]);

  // Fetch customer data
  useEffect(() => {
    const fetchKhachHangThanThiet = async () => {
      try {
        const params = {
          startDate: formatToInstant(dateKhachHang[0]),
          endDate: formatToInstant(moment(dateKhachHang[1]).endOf('day')),
          page: 0,
          size: 10,
        };
        console.log('Sending request to /khach-hang-than-thiet with:', params);
        const data = await ThongKeService.layKhachHangThanThiet(params);
        const translatedData = data.content.map(item => ({
          ...item,
          memberTier: memberTierTranslations[item.memberTier]?.text || item.memberTier,
          memberTierColor: memberTierTranslations[item.memberTier]?.color || '#000000',
        }));
        setKhachHangThanThiet(translatedData);
      } catch (error) {
        console.error('Lỗi lấy khách hàng thân thiết:', error);
        message.error('Không thể tải dữ liệu khách hàng thân thiết.');
      }
    };

    if (activeTab === 'khach-hang') {
      fetchKhachHangThanThiet();
    }
  }, [activeTab, dateKhachHang]);

  // Fetch payment, promotion, order status, and order time data
  useEffect(() => {
    const fetchPhuongThucThanhToan = async () => {
      try {
        const startDate = formatToLocalDateTime(datePhuongThuc[0]);
        const endDate = formatToLocalDateTime(moment(datePhuongThuc[1]).endOf('day'));
        console.log('Sending request to /phuong-thuc-thanh-toan with:', {
          ngayBatDau: startDate,
          ngayKetThuc: endDate,
        });
        const data = await ThongKeService.layPhuongThucThanhToan(
          encodeURIComponent(startDate),
          encodeURIComponent(endDate)
        );
        setPhuongThucThanhToan(data || []);
      } catch (error) {
        console.error('Lỗi lấy phương thức thanh toán:', error);
        message.error('Không thể tải dữ liệu phương thức thanh toán.');
        setPhuongThucThanhToan([]);
      }
    };

    const fetchKhuyenMai = async () => {
      try {
        const startDate = formatToInstant(dateKhuyenMai[0]);
        const endDate = formatToInstant(moment(dateKhuyenMai[1]).endOf('day'));
        console.log('Sending request to /khuyen-mai with:', {
          ngayBatDau: startDate,
          ngayKetThuc: endDate,
        });
        const data = await ThongKeService.layKhuyenMai(
          encodeURIComponent(startDate),
          encodeURIComponent(endDate)
        );
        setKhuyenMai(data || []);
      } catch (error) {
        console.error('Lỗi lấy khuyến mãi:', error);
        message.error('Không thể tải dữ liệu khuyến mãi.');
        setKhuyenMai([]);
      }
    };

    const fetchDonHangTheoTrangThai = async () => {
      try {
        const startDate = formatToLocalDateTime(dateDonHangTrangThai[0]);
        const endDate = formatToLocalDateTime(moment(dateDonHangTrangThai[1]).endOf('day'));
        console.log('Sending request to /don-hang-trang-thai with:', {
          ngayBatDau: startDate,
          ngayKetThuc: endDate,
        });
        const data = await ThongKeService.layDonHangTheoTrangThai(
          encodeURIComponent(startDate),
          encodeURIComponent(endDate)
        );
        const translatedData = data.map(item => ({
          ...item,
          trangThai: statusTranslations[item.trangThai] || item.trangThai,
        }));
        setDonHangTheoTrangThai(translatedData || []);
      } catch (error) {
        console.error('Lỗi lấy đơn hàng theo trạng thái:', error);
        message.error('Không thể tải dữ liệu đơn hàng theo trạng thái.');
        setDonHangTheoTrangThai([]);
      }
    };

    const fetchDonHangTheoThoiGian = async () => {
      try {
        const startDate = formatToInstant(dateDonHangThoiGian[0]);
        const endDate = formatToInstant(moment(dateDonHangThoiGian[1]).endOf('day'));
        console.log('Sending request to /don-hang-thoi-gian with:', {
          ngayBatDau: startDate,
          ngayKetThuc: endDate,
        });
        const data = await ThongKeService.layDonHangTheoThoiGian(
          encodeURIComponent(startDate),
          encodeURIComponent(endDate)
        );
        const parsedData = data.map((item) => ({
          ...item,
          ngay: moment.tz(item.ngay, 'Asia/Ho_Chi_Minh').toDate(),
        }));
        setDonHangTheoThoiGian(parsedData || []);
      } catch (error) {
        console.error('Lỗi lấy đơn hàng theo thời gian:', error);
        message.error('Không thể tải dữ liệu đơn hàng theo thời gian.');
        setDonHangTheoThoiGian([]);
      }
    };

    if (activeTab === 'khuyen-mai') {
      fetchPhuongThucThanhToan();
      fetchKhuyenMai();
      fetchDonHangTheoTrangThai();
      fetchDonHangTheoThoiGian();
    }
  }, [activeTab, datePhuongThuc, dateKhuyenMai, dateDonHangTrangThai, dateDonHangThoiGian]);

  // Fetch employee data
  useEffect(() => {
    const fetchNhanVienBanHang = async () => {
      try {
        const startDate = formatToInstant(dateNhanVien[0]);
        const endDate = formatToInstant(moment(dateNhanVien[1]).endOf('day'));
        console.log('Sending request to /nhan-vien-ban-hang with:', {
          ngayBatDau: startDate,
          ngayKetThuc: endDate,
        });
        const data = await ThongKeService.layNhanVienBanHang(
          encodeURIComponent(startDate),
          encodeURIComponent(endDate)
        );
        setNhanVienBanHang(data || []);
      } catch (error) {
        console.error('Lỗi lấy nhân viên bán hàng:', error);
        message.error('Không thể tải dữ liệu nhân viên bán hàng.');
        setNhanVienBanHang([]);
      }
    };

    if (activeTab === 'nhan-vien') {
      fetchNhanVienBanHang();
    }
  }, [activeTab, dateNhanVien]);

  // Chart data for revenue
  const chartDataDoanhThu = {
    labels: doanhThuData.map((item) =>
      moment(item.ngay).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY')
    ),
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: doanhThuData.map((item) => item.tongDoanhThu || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptionsDoanhThu = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14 } } },
      title: { display: true, text: 'Biểu đồ Doanh thu', font: { size: 18 } },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Doanh thu (VND)', font: { size: 14 } } },
      x: { title: { display: true, text: 'Thời gian', font: { size: 14 } } },
    },
  };

  // Chart data for revenue comparison
  const chartDataSoSanhDoanhThu = {
    labels: soSanhData.map((item) => item.ky),
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: soSanhData.map((item) => item.doanhThu || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Tỷ lệ tăng trưởng (%)',
        data: soSanhData.map((item) => item.tyLeTangTruong || 0),
        backgroundColor: 'rgba(249, 115, 22, 0.6)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptionsSoSanhDoanhThu = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14 } } },
      title: { display: true, text: 'So Sánh Doanh Thu', font: { size: 18 } },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Giá trị', font: { size: 14 } } },
      x: { title: { display: true, text: 'Kỳ', font: { size: 14 } } },
    },
  };

  // Chart data for orders by status
  const chartDataDonHangTrangThai = {
    labels: donHangTheoTrangThai.map((item) => item.trangThai),
    datasets: [
      {
        label: 'Số lượng đơn hàng',
        data: donHangTheoTrangThai.map((item) => item.soLuongDonHang || 0),
        backgroundColor: [
          '#EF4444', // Đã Hủy
          '#3B82F6', // Đã Thanh Toán
          '#F59E0B', // Chờ Thanh Toán
          '#10B981', // Hoàn Thành
          '#8B5CF6', // Đang Xác Nhận
          '#EC4899', // Đang Giao Hàng
          '#6B7280', // Đã Trả Hàng
          '#F97316', // Đã Hoàn Tiền
          '#14B8A6', // Hoàn Trả Hoàn Tất
        ],
        borderColor: [
          '#DC2626',
          '#2563EB',
          '#D97706',
          '#059669',
          '#7C3AED',
          '#DB2777',
          '#4B5563',
          '#EA580C',
          '#0D9488',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptionsDonHangTrangThai = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { size: 12 },
          padding: 10,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Đơn Hàng Theo Trạng Thái',
        font: { size: 16, weight: 'bold' },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        cornerRadius: 6,
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 8,
        shadowColor: 'rgba(0,0,0,0.1)',
      },
    },
  };

  // Chart data for orders by time
  const chartDataDonHangThoiGian = {
    labels: donHangTheoThoiGian.map((item) =>
      moment(item.ngay).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY')
    ),
    datasets: [
      {
        label: 'Số lượng đơn hàng',
        data: donHangTheoThoiGian.map((item) => item.soLuongDonHang || 0),
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptionsDonHangThoiGian = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14 } } },
      title: { display: true, text: 'Đơn Hàng Theo Thời Gian', font: { size: 18 } },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Số lượng đơn hàng', font: { size: 14 } },
      },
      x: {
        title: { display: true, text: 'Thời gian', font: { size: 14 } },
      },
    },
  };

  // Columns for best-selling products
  const banChayColumns = [
    { title: 'Mã sản phẩm', dataIndex: 'maSanPham', key: 'maSanPham' },
    { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', key: 'tenSanPham' },
    { title: 'Màu sắc', dataIndex: 'mauSac', key: 'mauSac' },
    { title: 'Kích thước', dataIndex: 'kichCo', key: 'kichCo' },
    { title: 'Số lượng bán', dataIndex: 'soLuongBan', key: 'soLuongBan' },
    { title: 'Doanh thu (VND)', dataIndex: 'doanhThu', key: 'doanhThu', render: (value) => value ? value.toLocaleString() : '0' },
  ];

  // Columns for low inventory products
  const tonKhoThapColumns = [
    { title: 'Mã sản phẩm', dataIndex: 'maSanPham', key: 'maSanPham' },
    { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', key: 'tenSanPham' },
    { title: 'Số lượng tồn', dataIndex: 'soLuongTon', key: 'soLuongTon' },
    { title: 'Ngưỡng tối thiểu', dataIndex: 'nguongToiThieu', key: 'nguongToiThieu' },
  ];

  // Columns for long inventory products
  const tonKhoLauColumns = [
    { title: 'Mã sản phẩm', dataIndex: 'maSanPham', key: 'maSanPham' },
    { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', key: 'tenSanPham' },
    { title: 'Số lượng tồn', dataIndex: 'soLuongTon', key: 'soLuongTon' },
    {
      title: 'Ngày cập nhật cuối',
      dataIndex: 'ngayCapNhatCuoi',
      key: 'ngayCapNhatCuoi',
      render: (value) => (value ? moment(value).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY') : 'N/A'),
    },
  ];

  // Columns for faithful customers
  const khachHangColumns = [
    { title: 'Mã khách hàng', dataIndex: 'maKhachHang', key: 'maKhachHang' },
    { title: 'Tên khách hàng', dataIndex: 'tenKhachHang', key: 'tenKhachHang' },
    { title: 'Số lượng đơn', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
    { title: 'Tổng chi tiêu (VND)', dataIndex: 'tongChiTieu', key: 'tongChiTieu', render: (value) => value ? value.toLocaleString() : '0' },
    { title: 'Điểm tích lũy', dataIndex: 'loyaltyPoints', key: 'loyaltyPoints' },
    {
      title: 'Hạng thành viên',
      dataIndex: 'memberTier',
      key: 'memberTier',
      render: (text, record) => (
        <span style={{ color: record.memberTierColor, fontWeight: 'bold' }}>
          {text}
        </span>
      ),
    },
  ];

  // Columns for payment methods
  const phuongThucThanhToanColumns = [
    { title: 'Phương thức', dataIndex: 'phuongThuc', key: 'phuongThuc' },
    { title: 'Số lượng đơn', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
    { title: 'Tỷ lệ (%)', dataIndex: 'tyLe', key: 'tyLe', render: (value) => value ? value.toFixed(2) : '0.00' },
    { title: 'Tổng thu (VND)', dataIndex: 'tongDoanhThu', key: 'tongDoanhThu', render: (value) => value ? value.toLocaleString() : '0' },
  ];

  // Columns for promotions
  const khuyenMaiColumns = [
    { title: 'Mã khuyến mãi', dataIndex: 'maKhuyenMai', key: 'maKhuyenMai' },
    { title: 'Tên khuyến mãi', dataIndex: 'tenKhuyenMai', key: 'tenKhuyenMai' },
    { title: 'Số lần sử dụng', dataIndex: 'soLanSuDung', key: 'soLanSuDung' },
    { title: 'Tổng doanh thu (VND)', dataIndex: 'tongDoanhThu', key: 'tongDoanhThu', render: (value) => value ? value.toLocaleString() : '0' },
  ];

  // Columns for orders by status
  const donHangTrangThaiColumns = [
    { title: 'Trạng thái', dataIndex: 'trangThai', key: 'trangThai' },
    { title: 'Số lượng đơn', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
  ];

  // Columns for orders by time
  const donHangThoiGianColumns = [
    {
      title: 'Ngày',
      dataIndex: 'ngay',
      key: 'ngay',
      render: (value) => moment(value).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY'),
    },
    { title: 'Số lượng đơn', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
  ];

  // Columns for employee sales
  const nhanVienBanHangColumns = [
    { title: 'Mã nhân viên', dataIndex: 'maNhanVien', key: 'maNhanVien' },
    { title: 'Tên nhân viên', dataIndex: 'tenNhanVien', key: 'tenNhanVien' },
    { title: 'Số lượng đơn', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
    { title: 'Tổng doanh thu (VND)', dataIndex: 'tongDoanhThu', key: 'tongDoanhThu', render: (value) => value ? value.toLocaleString() : '0' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">Thống Kê Quản Trị</h1>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="bg-white rounded-xl shadow-lg"
        tabBarStyle={{ padding: '0 16px', fontWeight: '600', color: '#1f2937' }}
      >
        <TabPane tab="Doanh Thu" key="doanh-thu">
          <Card className="mb-6 rounded-xl shadow-md bg-white" bodyStyle={{ padding: '24px' }}>
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} md={6}>
                <Select
                  value={donViThoiGian}
                  onChange={handleDonViThoiGianChange}
                  className="w-full"
                  placeholder="Đơn vị thời gian"
                >
                  <Option value="NGAY">Ngày</Option>
                  <Option value="TUAN">Tuần</Option>
                  <Option value="THANG">Tháng</Option>
                  <Option value="QUY">Quý</Option>
                  <Option value="NAM">Năm</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  value={billType}
                  onChange={setBillType}
                  className="w-full"
                  placeholder="Loại đơn hàng"
                  allowClear
                >
                  <Option value="ONLINE">Online</Option>
                  <Option value="OFFLINE">Offline</Option>
                </Select>
              </Col>
              <Col xs={24} md={12}>
                <RangePicker
                  value={dateDoanhThu}
                  onChange={(dates) => setDateDoanhThu(dates || [null, null])}
                  className="w-full"
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-700">
                Doanh thu hôm nay: <span className="text-blue-600">{doanhThuHomNay?.tongDoanhThu?.toLocaleString() || '0'} VND</span>
              </h3>
              <h3 className="text-xl font-semibold text-gray-700 mt-2">
                Tổng doanh thu ({moment(dateDoanhThu[0]).format('DD/MM/YYYY')} - {moment(dateDoanhThu[1]).format('DD/MM/YYYY')}): <span className="text-blue-600">{totalDoanhThu.toLocaleString()} VND</span>
              </h3>
            </div>
            <Bar data={chartDataDoanhThu} options={chartOptionsDoanhThu} />
          </Card>
          <Card className="rounded-xl shadow-md bg-white" bodyStyle={{ padding: '24px' }}>
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} md={8}>
                <Select
                  value={kySoSanh}
                  onChange={handleKySoSanhChange}
                  className="w-full"
                  placeholder="Kỳ so sánh"
                >
                  <Option value="NGAY">Ngày</Option>
                  <Option value="THANG">Tháng</Option>
                  <Option value="QUY">Quý</Option>
                  <Option value="NAM">Năm</Option>
                </Select>
              </Col>
            </Row>
            <Bar data={chartDataSoSanhDoanhThu} options={chartOptionsSoSanhDoanhThu} />
          </Card>
        </TabPane>
        <TabPane tab="Sản Phẩm" key="san-pham">
          <Card className="mb-6 rounded-xl shadow-md bg-white" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Sản Phẩm Bán Chạy</h3>
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24} md={8}>
                <Select
                  value={topSanPham}
                  onChange={setTopSanPham}
                  className="w-full"
                  placeholder="Số lượng sản phẩm"
                >
                  <Option value={1}>Top 1</Option>
                  <Option value={5}>Top 5</Option>
                  <Option value={10}>Top 10</Option>
                  <Option value={20}>Top 20</Option>
                  <Option value={30}>Top 30</Option>
                </Select>
              </Col>
              <Col xs={24} md={16}>
                <RangePicker
                  value={dateSanPham}
                  onChange={(dates) => setDateSanPham(dates || [null, null])}
                  className="w-full"
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
            <Table
              columns={banChayColumns}
              dataSource={sanPhamBanChay}
              rowKey="uniqueKey"
              className="rounded-lg overflow-hidden"
            />
          </Card>
          <Card className="mb-6 rounded-xl shadow-md bg-white" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Sản Phẩm Tồn Kho Thấp</h3>
            <Select
              value={nguongTonKho}
              onChange={setNguongTonKho}
              className="w-32 mb-4"
              placeholder="Ngưỡng tồn kho"
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={20}>20</Option>
              <Option value={20}>30</Option>
            </Select>
            <Table
              columns={tonKhoThapColumns}
              dataSource={sanPhamTonKhoThap}
              rowKey="uniqueKey"
              className="rounded-lg overflow-hidden"
            />
          </Card>
          <Card className="rounded-xl shadow-md bg-white" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Sản Phẩm Tồn Kho Lâu</h3>
            <Select
              value={soNgayTonKhoLau}
              onChange={setSoNgayTonKhoLau}
              className="w-32 mb-4"
              placeholder="Số ngày tồn kho"
            >
              <Option value={15}>15 ngày</Option>
              <Option value={30}>30 ngày</Option>
              <Option value={60}>60 ngày</Option>
              <Option value={90}>90 ngày</Option>
            </Select>
            <Table
              columns={tonKhoLauColumns}
              dataSource={sanPhamTonKhoLau}
              rowKey="uniqueKey"
              className="rounded-lg overflow-hidden"
            />
          </Card>
        </TabPane>
        <TabPane tab="Khách Hàng" key="khach-hang">
          <Card className="mb-6 rounded-xl shadow-md bg-white" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Khách Hàng Thân Thiết</h3>
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24}>
                <RangePicker
                  value={dateKhachHang}
                  onChange={(dates) => setDateKhachHang(dates || [null, null])}
                  className="w-full"
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
            <Table
              columns={khachHangColumns}
              dataSource={khachHangThanThiet}
              rowKey="maKhachHang"
              className="rounded-lg overflow-hidden"
            />
          </Card>
        </TabPane>
        <TabPane tab="Khuyến Mãi & Thanh Toán" key="khuyen-mai">
          <Card className="mb-6 rounded-xl shadow-md bg-white" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Phương Thức Thanh Toán</h3>
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24}>
                <RangePicker
                  value={datePhuongThuc}
                  onChange={(dates) => setDatePhuongThuc(dates || [null, null])}
                  className="w-full"
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
            <Table
              columns={phuongThucThanhToanColumns}
              dataSource={phuongThucThanhToan}
              rowKey="phuongThuc"
              className="rounded-lg overflow-hidden"
            />
          </Card>
          <Card className="mb-6 rounded-xl shadow-md bg-white" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Khuyến Mãi</h3>
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24}>
                <RangePicker
                  value={dateKhuyenMai}
                  onChange={(dates) => setDateKhuyenMai(dates || [null, null])}
                  className="w-full"
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
            <Table
              columns={khuyenMaiColumns}
              dataSource={khuyenMai}
              rowKey="maKhuyenMai"
              className="rounded-lg overflow-hidden"
            />
          </Card>
          <Card className="mb-6 rounded-xl shadow-md bg-white" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Đơn Hàng Theo Trạng Thái</h3>
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24}>
                <RangePicker
                  value={dateDonHangTrangThai}
                  onChange={(dates) => setDateDonHangTrangThai(dates || [null, null])}
                  className="w-full"
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
            <div style={{ height: '300px', maxWidth: '500px', margin: '0 auto' }}>
              <Pie data={chartDataDonHangTrangThai} options={chartOptionsDonHangTrangThai} />
            </div>
            <Table
              columns={donHangTrangThaiColumns}
              dataSource={donHangTheoTrangThai}
              rowKey="trangThai"
              className="rounded-lg overflow-hidden mt-4"
            />
          </Card>
          <Card className="rounded-xl shadow-md bg-white" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Đơn Hàng Theo Thời Gian</h3>
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24}>
                <RangePicker
                  value={dateDonHangThoiGian}
                  onChange={(dates) => setDateDonHangThoiGian(dates || [null, null])}
                  className="w-full"
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
            <Bar data={chartDataDonHangThoiGian} options={chartOptionsDonHangThoiGian} />
            <Table
              columns={donHangThoiGianColumns}
              dataSource={donHangTheoThoiGian}
              rowKey="ngay"
              className="rounded-lg overflow-hidden mt-4"
            />
          </Card>
        </TabPane>
        <TabPane tab="Nhân Viên" key="nhan-vien">
          <Card className="mb-6 rounded-xl shadow-md bg-white" bodyStyle={{ padding: '24px' }}>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Nhân Viên Bán Hàng</h3>
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24}>
                <RangePicker
                  value={dateNhanVien}
                  onChange={(dates) => setDateNhanVien(dates || [null, null])}
                  className="w-full"
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
            <Table
              columns={nhanVienBanHangColumns}
              dataSource={nhanVienBanHang}
              rowKey="maNhanVien"
              className="rounded-lg overflow-hidden"
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ThongKeAdmin;
