import React, { useState, useEffect } from 'react';
import { Tabs, DatePicker, Select, Table, Card, Row, Col } from 'antd';
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
import moment from 'moment';
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
  const [billType, setBillType] = useState(null); // Add billType state
  const [ngayBatDau, setNgayBatDau] = useState(moment().subtract(7, 'days'));
  const [ngayKetThuc, setNgayKetThuc] = useState(moment());
  const [kySoSanh, setKySoSanh] = useState('THANG');
  const [topSanPham, setTopSanPham] = useState(5);
  const [nguongTonKho, setNguongTonKho] = useState(10);
  const [soNgayTonKhoLau, setSoNgayTonKhoLau] = useState(30);
  const [khachHangFilter, setKhachHangFilter] = useState({
    code: '',
    name: '',
    phoneNumber: '',
    email: '',
    isBirthday: null,
    minPoints: null,
    maxPoints: null,
    memberTier: '',
  });

  // Fetch revenue data
  useEffect(() => {
    const fetchDoanhThu = async () => {
      try {
        const yeuCau = {
          donViThoiGian,
          ngayBatDau: ngayBatDau.toISOString(),
          ngayKetThuc: ngayKetThuc.endOf('day').toISOString(),
          billType, // Include billType in request
        };
        const data = await ThongKeService.layDoanhThuTheoThoiGian(yeuCau);
        setDoanhThuData(data);
      } catch (error) {
        console.error('Lỗi lấy dữ liệu doanh thu:', error);
      }
    };

    const fetchDoanhThuHomNay = async () => {
      try {
        const data = await ThongKeService.layDoanhThuHomNay();
        setDoanhThuHomNay(data);
      } catch (error) {
        console.error('Lỗi lấy doanh thu hôm nay:', error);
      }
    };

    const fetchSoSanhDoanhThu = async () => {
      try {
        const data = await ThongKeService.soSanhDoanhThu(kySoSanh);
        setSoSanhData(data);
      } catch (error) {
        console.error('Lỗi so sánh doanh thu:', error);
      }
    };

    if (activeTab === 'doanh-thu') {
      fetchDoanhThu();
      fetchDoanhThuHomNay();
      fetchSoSanhDoanhThu();
    }
  }, [activeTab, donViThoiGian, ngayBatDau, ngayKetThuc, kySoSanh, billType]);

  // Fetch product data
  useEffect(() => {
    const fetchSanPhamBanChay = async () => {
      try {
        const data = await ThongKeService.laySanPhamBanChay(
          topSanPham,
          ngayBatDau.toISOString(),
          ngayKetThuc.endOf('day').toISOString()
        );
        setSanPhamBanChay(data);
      } catch (error) {
        console.error('Lỗi lấy sản phẩm bán chạy:', error);
      }
    };

    const fetchSanPhamTonKhoThap = async () => {
      try {
        const data = await ThongKeService.laySanPhamTonKhoThap(nguongTonKho);
        setSanPhamTonKhoThap(data);
      } catch (error) {
        console.error('Lỗi lấy sản phẩm tồn kho thấp:', error);
      }
    };

    const fetchSanPhamTonKhoLau = async () => {
      try {
        const data = await ThongKeService.laySanPhamTonKhoLau(soNgayTonKhoLau);
        setSanPhamTonKhoLau(data);
      } catch (error) {
        console.error('Lỗi lấy sản phẩm tồn kho lâu:', error);
      }
    };

    if (activeTab === 'san-pham') {
      fetchSanPhamBanChay();
      fetchSanPhamTonKhoThap();
      fetchSanPhamTonKhoLau();
    }
  }, [activeTab, topSanPham, ngayBatDau, ngayKetThuc, nguongTonKho, soNgayTonKhoLau]);

  // Fetch customer, payment, promotion, and employee data
  useEffect(() => {
    const fetchKhachHangThanThiet = async () => {
      try {
        const params = {
          code: khachHangFilter.code || null,
          name: khachHangFilter.name || null,
          phoneNumber: khachHangFilter.phoneNumber || null,
          email: khachHangFilter.email || null,
          startDate: ngayBatDau ? ngayBatDau.toISOString() : null,
          endDate: ngayKetThuc ? ngayKetThuc.endOf('day').toISOString() : null,
          isBirthday: khachHangFilter.isBirthday,
          minPoints: khachHangFilter.minPoints,
          maxPoints: khachHangFilter.maxPoints,
          memberTier: khachHangFilter.memberTier || null,
          page: 0,
          size: 10,
        };
        const data = await ThongKeService.layKhachHangThanThiet(params);
        setKhachHangThanThiet(data.content || data); // Handle paginated response
      } catch (error) {
        console.error('Lỗi lấy khách hàng thân thiết:', error);
      }
    };

    const fetchPhuongThucThanhToan = async () => {
      try {
        const data = await ThongKeService.layPhuongThucThanhToan();
        setPhuongThucThanhToan(data);
      } catch (error) {
        console.error('Lỗi lấy phương thức thanh toán:', error);
      }
    };

    const fetchKhuyenMai = async () => {
      try {
        const data = await ThongKeService.layKhuyenMai(
          ngayBatDau.toISOString(),
          ngayKetThuc.endOf('day').toISOString()
        );
        setKhuyenMai(data);
      } catch (error) {
        console.error('Lỗi lấy khuyến mãi:', error);
      }
    };

    const fetchDonHangTheoTrangThai = async () => {
      try {
        const data = await ThongKeService.layDonHangTheoTrangThai();
        setDonHangTheoTrangThai(data);
      } catch (error) {
        console.error('Lỗi lấy đơn hàng theo trạng thái:', error);
      }
    };

    const fetchDonHangTheoThoiGian = async () => {
      try {
        const data = await ThongKeService.layDonHangTheoThoiGian(
          ngayBatDau.toISOString(),
          ngayKetThuc.endOf('day').toISOString()
        );
        setDonHangTheoThoiGian(data);
      } catch (error) {
        console.error('Lỗi lấy đơn hàng theo thời gian:', error);
      }
    };

    const fetchNhanVienBanHang = async () => {
      try {
        const data = await ThongKeService.layNhanVienBanHang(
          ngayBatDau.toISOString(),
          ngayKetThuc.endOf('day').toISOString()
        );
        setNhanVienBanHang(data);
      } catch (error) {
        console.error('Lỗi lấy nhân viên bán hàng:', error);
      }
    };

    if (activeTab === 'khach-hang') {
      fetchKhachHangThanThiet();
    }
    if (activeTab === 'khuyen-mai') {
      fetchPhuongThucThanhToan();
      fetchKhuyenMai();
      fetchDonHangTheoTrangThai();
      fetchDonHangTheoThoiGian();
    }
    if (activeTab === 'nhan-vien') {
      fetchNhanVienBanHang();
    }
  }, [activeTab, ngayBatDau, ngayKetThuc, khachHangFilter]);

  // Chart data for revenue
  const chartDataDoanhThu = {
    labels: doanhThuData.map((item) => moment(item.ngay).format('DD/MM/YYYY')),
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: doanhThuData.map((item) => item.tongDoanhThu),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptionsDoanhThu = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Biểu đồ Doanh thu' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Doanh thu (VND)' } },
      x: { title: { display: true, text: 'Thời gian' } },
    },
  };

  // Chart data for orders by status
  const chartDataDonHangTrangThai = {
    labels: donHangTheoTrangThai.map((item) => item.trangThai),
    datasets: [
      {
        label: 'Số lượng đơn hàng',
        data: donHangTheoTrangThai.map((item) => item.soLuongDonHang),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptionsDonHangTrangThai = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Biểu đồ Đơn hàng theo Trạng thái' },
    },
  };

  // Chart data for orders by time
  const chartDataDonHangThoiGian = {
    labels: donHangTheoThoiGian.map((item) => moment(item.ngay).format('DD/MM/YYYY')),
    datasets: [
      {
        label: 'Số lượng đơn hàng',
        data: donHangTheoThoiGian.map((item) => item.soLuongDonHang),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptionsDonHangThoiGian = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Biểu đồ Đơn hàng theo Thời gian' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Số lượng đơn hàng' } },
      x: { title: { display: true, text: 'Thời gian' } },
    },
  };

  // Columns for revenue comparison table
  const soSanhColumns = [
    { title: 'Kỳ', dataIndex: 'ky', key: 'ky' },
    { title: 'Doanh thu (VND)', dataIndex: 'doanhThu', key: 'doanhThu', render: (value) => value.toLocaleString() },
    {
      title: 'Tỷ lệ tăng trưởng (%)',
      dataIndex: 'tyLeTangTruong',
      key: 'tyLeTangTruong',
      render: (value) => (value ? value.toFixed(2) : 'N/A'),
    },
  ];

  // Columns for best-selling products table
  const banChayColumns = [
    { title: 'Mã sản phẩm', dataIndex: 'maSanPham', key: 'maSanPham' },
    { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', key: 'tenSanPham' },
    { title: 'Màu sắc', dataIndex: 'mauSac', key: 'mauSac' },
    { title: 'Kích cỡ', dataIndex: 'kichCo', key: 'kichCo' },
    { title: 'Số lượng bán', dataIndex: 'soLuongBan', key: 'soLuongBan' },
    { title: 'Doanh thu (VND)', dataIndex: 'doanhThu', key: 'doanhThu', render: (value) => value.toLocaleString() },
  ];

  // Columns for low inventory products table
  const tonKhoThapColumns = [
    { title: 'Mã sản phẩm', dataIndex: 'maSanPham', key: 'maSanPham' },
    { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', key: 'tenSanPham' },
    { title: 'Số lượng tồn', dataIndex: 'soLuongTon', key: 'soLuongTon' },
    { title: 'Ngưỡng tối thiểu', dataIndex: 'nguongToiThieu', key: 'nguongToiThieu' },
  ];

  // Columns for long inventory products table
  const tonKhoLauColumns = [
    { title: 'Mã sản phẩm', dataIndex: 'maSanPham', key: 'maSanPham' },
    { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', key: 'tenSanPham' },
    { title: 'Số lượng tồn', dataIndex: 'soLuongTon', key: 'soLuongTon' },
    {
      title: 'Ngày cập nhật cuối',
      dataIndex: 'ngayCapNhatCuoi',
      key: 'ngayCapNhatCuoi',
      render: (value) => moment(value).format('DD/MM/YYYY HH:mm'),
    },
  ];

  // Columns for loyal customers table
  const khachHangColumns = [
    { title: 'Mã khách hàng', dataIndex: 'maKhachHang', key: 'maKhachHang' },
    { title: 'Tên khách hàng', dataIndex: 'tenKhachHang', key: 'tenKhachHang' },
    { title: 'Số lượng đơn hàng', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
    { title: 'Tổng chi tiêu (VND)', dataIndex: 'tongChiTieu', key: 'tongChiTieu', render: (value) => value.toLocaleString() },
    { title: 'Điểm tích lũy', dataIndex: 'loyaltyPoints', key: 'loyaltyPoints' },
    { title: 'Hạng thành viên', dataIndex: 'memberTier', key: 'memberTier' },
  ];

  // Columns for payment methods table
  const phuongThucThanhToanColumns = [
    { title: 'Phương thức', dataIndex: 'phuongThuc', key: 'phuongThuc' },
    { title: 'Số lượng đơn hàng', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
    { title: 'Tỷ lệ (%)', dataIndex: 'tyLe', key: 'tyLe', render: (value) => value.toFixed(2) },
    { title: 'Tổng doanh thu (VND)', dataIndex: 'tongDoanhThu', key: 'tongDoanhThu', render: (value) => value.toLocaleString() },
  ];

  // Columns for promotions table
  const khuyenMaiColumns = [
    { title: 'Mã khuyến mãi', dataIndex: 'maKhuyenMai', key: 'maKhuyenMai' },
    { title: 'Tên khuyến mãi', dataIndex: 'tenKhuyenMai', key: 'tenKhuyenMai' },
    { title: 'Số lần sử dụng', dataIndex: 'soLanSuDung', key: 'soLanSuDung' },
    { title: 'Tổng doanh thu (VND)', dataIndex: 'tongDoanhThu', key: 'tongDoanhThu', render: (value) => value.toLocaleString() },
  ];

  // Columns for orders by status table
  const donHangTrangThaiColumns = [
    { title: 'Trạng thái', dataIndex: 'trangThai', key: 'trangThai' },
    { title: 'Số lượng đơn hàng', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
  ];

  // Columns for orders by time table
  const donHangThoiGianColumns = [
    { title: 'Ngày', dataIndex: 'ngay', key: 'ngay', render: (value) => moment(value).format('DD/MM/YYYY') },
    { title: 'Số lượng đơn hàng', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
  ];

  // Columns for employee sales table
  const nhanVienBanHangColumns = [
    { title: 'Mã nhân viên', dataIndex: 'maNhanVien', key: 'maNhanVien' },
    { title: 'Tên nhân viên', dataIndex: 'tenNhanVien', key: 'tenNhanVien' },
    { title: 'Số lượng đơn hàng', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
    { title: 'Tổng doanh thu (VND)', dataIndex: 'tongDoanhThu', key: 'tongDoanhThu', render: (value) => value.toLocaleString() },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Thống Kê Quản Trị</h1>
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="bg-white rounded-lg shadow">
        <TabPane tab="Thống Kê Doanh Thu" key="doanh-thu">
          <Card className="mb-6 rounded-lg shadow">
            <Row gutter={16} className="mb-4">
              <Col span={6}>
                <Select
                  value={donViThoiGian}
                  onChange={setDonViThoiGian}
                  className="w-full"
                  placeholder="Chọn đơn vị thời gian"
                >
                  <Option value="NGAY">Ngày</Option>
                  <Option value="TUAN">Tuần</Option>
                  <Option value="THANG">Tháng</Option>
                  <Option value="QUY">Quý</Option>
                  <Option value="NAM">Năm</Option>
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  value={billType}
                  onChange={setBillType}
                  className="w-full"
                  placeholder="Chọn loại đơn hàng"
                  allowClear
                >
                  <Option value="ONLINE">Online</Option>
                  <Option value="OFFLINE">Offline</Option>
                </Select>
              </Col>
              <Col span={12}>
                <RangePicker
                  value={[ngayBatDau, ngayKetThuc]}
                  onChange={(dates) => {
                    setNgayBatDau(dates ? dates[0] : null);
                    setNgayKetThuc(dates ? dates[1] : null);
                  }}
                  className="w-full"
                />
              </Col>
            </Row>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Doanh thu hôm nay: {doanhThuHomNay?.tongDoanhThu.toLocaleString() || '0'} VND
              </h3>
            </div>
            <Bar data={chartDataDoanhThu} options={chartOptionsDoanhThu} />
          </Card>
          <Card className="rounded-lg shadow">
            <Row gutter={16} className="mb-4">
              <Col span={8}>
                <Select
                  value={kySoSanh}
                  onChange={setKySoSanh}
                  className="w-full"
                  placeholder="Chọn kỳ so sánh"
                >
                  <Option value="THANG">Tháng</Option>
                  <Option value="QUY">Quý</Option>
                  <Option value="NAM">Năm</Option>
                </Select>
              </Col>
            </Row>
            <Table columns={soSanhColumns} dataSource={soSanhData} rowKey="ky" />
          </Card>
        </TabPane>
        <TabPane tab="Thống Kê Sản Phẩm" key="san-pham">
          <Card className="mb-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Sản Phẩm Bán Chạy</h3>
            <Row gutter={16} className="mb-4">
              <Col span={8}>
                <Select
                  value={topSanPham}
                  onChange={setTopSanPham}
                  className="w-full"
                  placeholder="Chọn số lượng sản phẩm"
                >
                  <Option value={5}>Top 5</Option>
                  <Option value={10}>Top 10</Option>
                </Select>
              </Col>
              <Col span={16}>
                <RangePicker
                  value={[ngayBatDau, ngayKetThuc]}
                  onChange={(dates) => {
                    setNgayBatDau(dates ? dates[0] : null);
                    setNgayKetThuc(dates ? dates[1] : null);
                  }}
                  className="w-full"
                />
              </Col>
            </Row>
            <Table columns={banChayColumns} dataSource={sanPhamBanChay} rowKey="maSanPham" />
          </Card>
          <Card className="mb-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Sản Phẩm Tồn Kho Thấp</h3>
            <Select
              value={nguongTonKho}
              onChange={setNguongTonKho}
              className="w-32 mb-4"
              placeholder="Ngưỡng tồn kho"
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={20}>20</Option>
            </Select>
            <Table columns={tonKhoThapColumns} dataSource={sanPhamTonKhoThap} rowKey="maSanPham" />
          </Card>
          <Card className="rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Sản Phẩm Tồn Kho Lâu</h3>
            <Select
              value={soNgayTonKhoLau}
              onChange={setSoNgayTonKhoLau}
              className="w-32 mb-4"
              placeholder="Số ngày tồn kho"
            >
              <Option value={30}>30 ngày</Option>
              <Option value={60}>60 ngày</Option>
              <Option value={90}>90 ngày</Option>
            </Select>
            <Table columns={tonKhoLauColumns} dataSource={sanPhamTonKhoLau} rowKey="maSanPham" />
          </Card>
        </TabPane>
        <TabPane tab="Thống Kê Khách Hàng" key="khach-hang">
          <Card className="mb-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Khách Hàng Thân Thiết</h3>
            <Row gutter={16} className="mb-4">
              <Col span={6}>
                <input
                  type="text"
                  placeholder="Mã khách hàng"
                  value={khachHangFilter.code}
                  onChange={(e) => setKhachHangFilter({ ...khachHangFilter, code: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </Col>
              <Col span={6}>
                <input
                  type="text"
                  placeholder="Tên khách hàng"
                  value={khachHangFilter.name}
                  onChange={(e) => setKhachHangFilter({ ...khachHangFilter, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </Col>
              <Col span={6}>
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={khachHangFilter.phoneNumber}
                  onChange={(e) => setKhachHangFilter({ ...khachHangFilter, phoneNumber: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </Col>
              <Col span={6}>
                <input
                  type="text"
                  placeholder="Email"
                  value={khachHangFilter.email}
                  onChange={(e) => setKhachHangFilter({ ...khachHangFilter, email: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </Col>
            </Row>
            <Row gutter={16} className="mb-4">
              <Col span={6}>
                <Select
                  value={khachHangFilter.isBirthday}
                  onChange={(value) => setKhachHangFilter({ ...khachHangFilter, isBirthday: value })}
                  className="w-full"
                  placeholder="Sinh nhật"
                  allowClear
                >
                  <Option value={true}>Có</Option>
                  <Option value={false}>Không</Option>
                </Select>
              </Col>
              <Col span={6}>
                <input
                  type="number"
                  placeholder="Điểm tối thiểu"
                  value={khachHangFilter.minPoints || ''}
                  onChange={(e) => setKhachHangFilter({ ...khachHangFilter, minPoints: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </Col>
              <Col span={6}>
                <input
                  type="number"
                  placeholder="Điểm tối đa"
                  value={khachHangFilter.maxPoints || ''}
                  onChange={(e) => setKhachHangFilter({ ...khachHangFilter, maxPoints: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </Col>
              <Col span={6}>
                <input
                  type="text"
                  placeholder="Hạng thành viên"
                  value={khachHangFilter.memberTier}
                  onChange={(e) => setKhachHangFilter({ ...khachHangFilter, memberTier: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </Col>
            </Row>
            <Row gutter={16} className="mb-4">
              <Col span={24}>
                <RangePicker
                  value={[ngayBatDau, ngayKetThuc]}
                  onChange={(dates) => {
                    setNgayBatDau(dates ? dates[0] : null);
                    setNgayKetThuc(dates ? dates[1] : null);
                  }}
                  className="w-full"
                />
              </Col>
            </Row>
            <Table columns={khachHangColumns} dataSource={khachHangThanThiet} rowKey="maKhachHang" />
          </Card>
        </TabPane>
        <TabPane tab="Thống Kê Khuyến Mãi & Thanh Toán" key="khuyen-mai">
          <Card className="mb-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Phương Thức Thanh Toán</h3>
            <Table columns={phuongThucThanhToanColumns} dataSource={phuongThucThanhToan} rowKey="phuongThuc" />
          </Card>
          <Card className="mb-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Khuyến Mãi</h3>
            <Row gutter={16} className="mb-4">
              <Col span={24}>
                <RangePicker
                  value={[ngayBatDau, ngayKetThuc]}
                  onChange={(dates) => {
                    setNgayBatDau(dates ? dates[0] : null);
                    setNgayKetThuc(dates ? dates[1] : null);
                  }}
                  className="w-full"
                />
              </Col>
            </Row>
            <Table columns={khuyenMaiColumns} dataSource={khuyenMai} rowKey="maKhuyenMai" />
          </Card>
          <Card className="mb-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Đơn Hàng Theo Trạng Thái</h3>
            <Pie data={chartDataDonHangTrangThai} options={chartOptionsDonHangTrangThai} />
            <Table columns={donHangTrangThaiColumns} dataSource={donHangTheoTrangThai} rowKey="trangThai" />
          </Card>
          <Card className="rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Đơn Hàng Theo Thời Gian</h3>
            <Row gutter={16} className="mb-4">
              <Col span={24}>
                <RangePicker
                  value={[ngayBatDau, ngayKetThuc]}
                  onChange={(dates) => {
                    setNgayBatDau(dates ? dates[0] : null);
                    setNgayKetThuc(dates ? dates[1] : null);
                  }}
                  className="w-full"
                />
              </Col>
            </Row>
            <Bar data={chartDataDonHangThoiGian} options={chartOptionsDonHangThoiGian} />
            <Table columns={donHangThoiGianColumns} dataSource={donHangTheoThoiGian} rowKey="ngay" />
          </Card>
        </TabPane>
        <TabPane tab="Thống Kê Nhân Viên" key="nhan-vien">
          <Card className="mb-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Nhân Viên Bán Hàng</h3>
            <Row gutter={16} className="mb-4">
              <Col span={24}>
                <RangePicker
                  value={[ngayBatDau, ngayKetThuc]}
                  onChange={(dates) => {
                    setNgayBatDau(dates ? dates[0] : null);
                    setNgayKetThuc(dates ? dates[1] : null);
                  }}
                  className="w-full"
                />
              </Col>
            </Row>
            <Table columns={nhanVienBanHangColumns} dataSource={nhanVienBanHang} rowKey="maNhanVien" />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ThongKeAdmin;