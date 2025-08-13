// Clean refactored statistics page using AntD v5 Tabs items + Card styles (single implementation).
import React, { useState, useEffect } from 'react';
import { Tabs, Select, Table, Card, Row, Col, message } from 'antd';
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
  Legend
} from 'chart.js';
import moment from 'moment-timezone';
import DateRangeFilter from '../../../component/DateRangeFilter';
import ThongKeService from '../../../Service/AdminThongKe/ThongKeService';

ChartJS.register(CategoryScale, LinearScale, BarElement, PieController, ArcElement, Title, Tooltip, Legend);
const { Option } = Select;

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
  RETURN_COMPLETED: 'Hoàn Trả Hoàn Tất'
};

const memberTierTranslations = {
  BRONZE: { text: 'Đồng', color: '#CD7F32' },
  SILVER: { text: 'Bạc', color: '#C0C0C0' },
  GOLD: { text: 'Vàng', color: '#FFD700' },
  PLATINUM: { text: 'Bạch Kim', color: '#E5E4E2' }
};

const toLocalDT = (d) => (d ? moment(d).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss') : null);
const toInstant = (d) => (d ? moment(d).tz('Asia/Ho_Chi_Minh').toISOString() : null);

const ThongKeAdmin = () => {
  // State
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

  const now = moment();
  const last7 = moment().subtract(7, 'days');
  const mkRange = () => [moment(last7), moment(now)];
  const [dateDoanhThu, setDateDoanhThu] = useState(mkRange());
  const [dateSanPham, setDateSanPham] = useState(mkRange());
  const [dateKhachHang, setDateKhachHang] = useState(mkRange());
  const [datePhuongThuc, setDatePhuongThuc] = useState(mkRange());
  const [dateKhuyenMai, setDateKhuyenMai] = useState(mkRange());
  const [dateDonHangTrangThai, setDateDonHangTrangThai] = useState(mkRange());
  const [dateDonHangThoiGian, setDateDonHangThoiGian] = useState(mkRange());
  const [dateNhanVien, setDateNhanVien] = useState(mkRange());

  const totalDoanhThu = doanhThuData.reduce((s, i) => s + (i.tongDoanhThu || 0), 0);

  const handleDonViThoiGianChange = (val) => {
    setDonViThoiGian(val);
    let start, end;
    switch (val) {
      case 'THANG': start = moment().startOf('month'); end = moment().endOf('month'); break;
      case 'QUY': start = moment().startOf('quarter'); end = moment().endOf('quarter'); break;
      case 'NAM': start = moment().startOf('year'); end = moment().endOf('year'); break;
      case 'TUAN': start = moment().startOf('week'); end = moment().endOf('week'); break;
      default: start = moment().subtract(7, 'days'); end = moment();
    }
    setDateDoanhThu([start, end]);
  };

  // Effects per tab
  useEffect(() => {
    if (activeTab !== 'doanh-thu') return;
    (async () => {
      try {
        const req = {
          donViThoiGian,
          ngayBatDau: toLocalDT(dateDoanhThu[0]),
          ngayKetThuc: toLocalDT(moment(dateDoanhThu[1]).endOf('day')),
          billType
        };
        const [series, today, compare] = await Promise.all([
          ThongKeService.layDoanhThuTheoThoiGian(req),
          ThongKeService.layDoanhThuHomNay(),
          ThongKeService.soSanhDoanhThu(kySoSanh)
        ]);
        setDoanhThuData(series.map(i => ({ ...i, ngay: moment.tz(i.ngay, 'Asia/Ho_Chi_Minh').toDate() })));
        if (today?.ngay) today.ngay = moment.tz(today.ngay, 'Asia/Ho_Chi_Minh').toDate();
        setDoanhThuHomNay(today);
        setSoSanhData(compare);
      } catch { message.error('Không thể tải dữ liệu doanh thu'); }
    })();
  }, [activeTab, donViThoiGian, dateDoanhThu, billType, kySoSanh]);

  useEffect(() => {
    if (activeTab !== 'san-pham') return;
    (async () => {
      try {
        const [banChay, tonThap, tonLau] = await Promise.all([
          ThongKeService.laySanPhamBanChay(topSanPham, toInstant(dateSanPham[0]), toInstant(moment(dateSanPham[1]).endOf('day'))),
          ThongKeService.laySanPhamTonKhoThap(nguongTonKho),
          ThongKeService.laySanPhamTonKhoLau(soNgayTonKhoLau)
        ]);
        setSanPhamBanChay(banChay.map((i, idx) => ({ ...i, uniqueKey: `${i.maSanPham}-${idx}` })));
        setSanPhamTonKhoThap(tonThap.map((i, idx) => ({ ...i, uniqueKey: `${i.maSanPham}-low-${idx}` })));
        setSanPhamTonKhoLau(tonLau.map((i, idx) => ({
          ...i,
          ngayCapNhatCuoi: i.ngayCapNhatCuoi ? moment.tz(i.ngayCapNhatCuoi, 'Asia/Ho_Chi_Minh').toDate() : null,
          uniqueKey: `${i.maSanPham}-old-${idx}`
        })));
      } catch { message.error('Không thể tải dữ liệu sản phẩm'); }
    })();
  }, [activeTab, topSanPham, dateSanPham, nguongTonKho, soNgayTonKhoLau]);

  useEffect(() => {
    if (activeTab !== 'khach-hang') return;
    (async () => {
      try {
        const data = await ThongKeService.layKhachHangThanThiet({ startDate: toInstant(dateKhachHang[0]) });
        setKhachHangThanThiet((data?.content || []).map(i => ({
          ...i,
          memberTier: memberTierTranslations[i.memberTier]?.text || i.memberTier,
          memberTierColor: memberTierTranslations[i.memberTier]?.color || '#000'
        })));
      } catch { message.error('Không thể tải khách hàng thân thiết'); }
    })();
  }, [activeTab, dateKhachHang]);

  useEffect(() => {
    if (activeTab !== 'khuyen-mai') return;
    (async () => {
      try {
        const [pttt, km, trangThai, thoiGian] = await Promise.all([
          ThongKeService.layPhuongThucThanhToan(encodeURIComponent(toLocalDT(datePhuongThuc[0])), encodeURIComponent(toLocalDT(moment(datePhuongThuc[1]).endOf('day')))),
          ThongKeService.layKhuyenMai(encodeURIComponent(toInstant(dateKhuyenMai[0])), encodeURIComponent(toInstant(moment(dateKhuyenMai[1]).endOf('day')))),
          ThongKeService.layDonHangTheoTrangThai(encodeURIComponent(toLocalDT(dateDonHangTrangThai[0])), encodeURIComponent(toLocalDT(moment(dateDonHangTrangThai[1]).endOf('day')))),
          ThongKeService.layDonHangTheoThoiGian(encodeURIComponent(toInstant(dateDonHangThoiGian[0])), encodeURIComponent(toInstant(moment(dateDonHangThoiGian[1]).endOf('day'))))
        ]);
        setPhuongThucThanhToan(pttt || []);
        setKhuyenMai(km || []);
        setDonHangTheoTrangThai((trangThai || []).map(i => ({ ...i, trangThai: statusTranslations[i.trangThai] || i.trangThai })));
        setDonHangTheoThoiGian((thoiGian || []).map(i => ({ ...i, ngay: moment.tz(i.ngay, 'Asia/Ho_Chi_Minh').toDate() })));
      } catch { message.error('Không thể tải dữ liệu khuyến mãi / thanh toán'); }
    })();
  }, [activeTab, datePhuongThuc, dateKhuyenMai, dateDonHangTrangThai, dateDonHangThoiGian]);

  useEffect(() => {
    if (activeTab !== 'nhan-vien') return;
    (async () => {
      try {
        const data = await ThongKeService.layNhanVienBanHang(encodeURIComponent(toInstant(dateNhanVien[0])), encodeURIComponent(toInstant(moment(dateNhanVien[1]).endOf('day'))));
        setNhanVienBanHang(data || []);
      } catch { message.error('Không thể tải nhân viên bán hàng'); }
    })();
  }, [activeTab, dateNhanVien]);

  // Chart datasets
  const chartDataDoanhThu = {
    labels: doanhThuData.map(i => moment(i.ngay).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY')),
    datasets: [{ label: 'Doanh thu (VND)', data: doanhThuData.map(i => i.tongDoanhThu || 0), backgroundColor: 'rgba(59,130,246,0.6)' }]
  };
  const chartOptionsDoanhThu = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Biểu đồ Doanh thu' } } };
  const chartDataSoSanhDoanhThu = {
    labels: soSanhData.map(i => i.ky),
    datasets: [
      { label: 'Doanh thu (VND)', data: soSanhData.map(i => i.doanhThu || 0), backgroundColor: 'rgba(34,197,94,0.6)' },
      { label: 'Tỷ lệ tăng trưởng (%)', data: soSanhData.map(i => i.tyLeTangTruong || 0), backgroundColor: 'rgba(249,115,22,0.6)' }
    ]
  };
  const chartOptionsSoSanhDoanhThu = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'So Sánh Doanh Thu' } } };
  const chartDataDonHangTrangThai = {
    labels: donHangTheoTrangThai.map(i => i.trangThai),
    datasets: [{ label: 'Số lượng đơn hàng', data: donHangTheoTrangThai.map(i => i.soLuongDonHang || 0), backgroundColor: ['#EF4444','#3B82F6','#F59E0B','#10B981','#8B5CF6','#EC4899','#6B7280','#F97316','#14B8A6'] }]
  };
  const chartOptionsDonHangTrangThai = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' }, title: { display: true, text: 'Đơn Hàng Theo Trạng Thái' } } };
  const chartDataDonHangThoiGian = {
    labels: donHangTheoThoiGian.map(i => moment(i.ngay).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY')),
    datasets: [{ label: 'Số lượng đơn hàng', data: donHangTheoThoiGian.map(i => i.soLuongDonHang || 0), backgroundColor: 'rgba(139,92,246,0.6)' }]
  };
  const chartOptionsDonHangThoiGian = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Đơn Hàng Theo Thời Gian' } } };

  // Table columns
  const banChayColumns = [
    { title: 'Mã sản phẩm', dataIndex: 'maSanPham', key: 'maSanPham' },
    { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', key: 'tenSanPham' },
    { title: 'Màu sắc', dataIndex: 'mauSac', key: 'mauSac' },
    { title: 'Kích thước', dataIndex: 'kichCo', key: 'kichCo' },
    { title: 'Số lượng bán', dataIndex: 'soLuongBan', key: 'soLuongBan' },
    { title: 'Doanh thu (VND)', dataIndex: 'doanhThu', key: 'doanhThu', render: v => v ? v.toLocaleString() : '0' }
  ];
  const tonKhoThapColumns = [
    { title: 'Mã sản phẩm', dataIndex: 'maSanPham', key: 'maSanPham' },
    { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', key: 'tenSanPham' },
    { title: 'Số lượng tồn', dataIndex: 'soLuongTon', key: 'soLuongTon' },
    { title: 'Ngưỡng tối thiểu', dataIndex: 'nguongToiThieu', key: 'nguongToiThieu' }
  ];
  const tonKhoLauColumns = [
    { title: 'Mã sản phẩm', dataIndex: 'maSanPham', key: 'maSanPham' },
    { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', key: 'tenSanPham' },
    { title: 'Số lượng tồn', dataIndex: 'soLuongTon', key: 'soLuongTon' },
    { title: 'Ngày cập nhật cuối', dataIndex: 'ngayCapNhatCuoi', key: 'ngayCapNhatCuoi', render: v => v ? moment(v).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY') : 'N/A' }
  ];
  const khachHangColumns = [
    { title: 'Mã khách hàng', dataIndex: 'maKhachHang', key: 'maKhachHang' },
    { title: 'Tên khách hàng', dataIndex: 'tenKhachHang', key: 'tenKhachHang' },
    { title: 'Số lượng đơn', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
    { title: 'Tổng chi tiêu (VND)', dataIndex: 'tongChiTieu', key: 'tongChiTieu', render: v => v ? v.toLocaleString() : '0' },
    { title: 'Điểm tích lũy', dataIndex: 'loyaltyPoints', key: 'loyaltyPoints' },
    { title: 'Hạng thành viên', dataIndex: 'memberTier', key: 'memberTier', render: (text, r) => <span style={{ color: r.memberTierColor, fontWeight: 'bold' }}>{text}</span> }
  ];
  const phuongThucThanhToanColumns = [
    { title: 'Phương thức', dataIndex: 'phuongThuc', key: 'phuongThuc' },
    { title: 'Số lượng đơn', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
    { title: 'Tỷ lệ (%)', dataIndex: 'tyLe', key: 'tyLe', render: v => v ? v.toFixed(2) : '0.00' },
    { title: 'Tổng thu (VND)', dataIndex: 'tongDoanhThu', key: 'tongDoanhThu', render: v => v ? v.toLocaleString() : '0' }
  ];
  const khuyenMaiColumns = [
    { title: 'Mã khuyến mãi', dataIndex: 'maKhuyenMai', key: 'maKhuyenMai' },
    { title: 'Tên khuyến mãi', dataIndex: 'tenKhuyenMai', key: 'tenKhuyenMai' },
    { title: 'Số lần sử dụng', dataIndex: 'soLanSuDung', key: 'soLanSuDung' },
    { title: 'Tổng doanh thu (VND)', dataIndex: 'tongDoanhThu', key: 'tongDoanhThu', render: v => v ? v.toLocaleString() : '0' }
  ];
  const donHangTrangThaiColumns = [
    { title: 'Trạng thái', dataIndex: 'trangThai', key: 'trangThai' },
    { title: 'Số lượng đơn', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' }
  ];
  const donHangThoiGianColumns = [
    { title: 'Ngày', dataIndex: 'ngay', key: 'ngay', render: v => moment(v).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY') },
    { title: 'Số lượng đơn', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' }
  ];
  const nhanVienBanHangColumns = [
    { title: 'Mã nhân viên', dataIndex: 'maNhanVien', key: 'maNhanVien' },
    { title: 'Tên nhân viên', dataIndex: 'tenNhanVien', key: 'tenNhanVien' },
    { title: 'Số lượng đơn', dataIndex: 'soLuongDonHang', key: 'soLuongDonHang' },
    { title: 'Tổng doanh thu (VND)', dataIndex: 'tongDoanhThu', key: 'tongDoanhThu', render: v => v ? v.toLocaleString() : '0' }
  ];

  const cardStyles = { body: { padding: 24 } };

  const items = [
    { key: 'doanh-thu', label: 'Doanh Thu', children: (
      <>
        <Card className="mb-6 rounded-xl shadow-md bg-white" styles={cardStyles}>
          <Row gutter={[16,16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Select value={donViThoiGian} onChange={handleDonViThoiGianChange} className="w-full" placeholder="Đơn vị thời gian">
                <Option value="NGAY">Ngày</Option>
                <Option value="TUAN">Tuần</Option>
                <Option value="THANG">Tháng</Option>
                <Option value="QUY">Quý</Option>
                <Option value="NAM">Năm</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select value={billType} onChange={setBillType} className="w-full" placeholder="Loại đơn hàng" allowClear>
                <Option value="ONLINE">Online</Option>
                <Option value="OFFLINE">Offline</Option>
              </Select>
            </Col>
            <Col xs={24} md={12}>
              <DateRangeFilter value={dateDoanhThu} onChange={d=> setDateDoanhThu(d||[null,null])} />
            </Col>
          </Row>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-700">Doanh thu hôm nay: <span className="text-blue-600">{doanhThuHomNay?.tongDoanhThu?.toLocaleString()||'0'} VND</span></h3>
            <h3 className="text-xl font-semibold text-gray-700 mt-2">Tổng doanh thu ({moment(dateDoanhThu[0]).format('DD/MM/YYYY')} - {moment(dateDoanhThu[1]).format('DD/MM/YYYY')}): <span className="text-blue-600">{totalDoanhThu.toLocaleString()} VND</span></h3>
          </div>
          <Bar data={chartDataDoanhThu} options={chartOptionsDoanhThu} />
        </Card>
        <Card className="rounded-xl shadow-md bg-white" styles={cardStyles}>
          <Row gutter={[16,16]} className="mb-6">
            <Col xs={24} md={8}>
              <Select value={kySoSanh} onChange={setKySoSanh} className="w-full" placeholder="Kỳ so sánh">
                <Option value="NGAY">Ngày</Option>
                <Option value="THANG">Tháng</Option>
                <Option value="QUY">Quý</Option>
                <Option value="NAM">Năm</Option>
              </Select>
            </Col>
          </Row>
          <Bar data={chartDataSoSanhDoanhThu} options={chartOptionsSoSanhDoanhThu} />
        </Card>
      </>
    )},
    { key: 'san-pham', label: 'Sản Phẩm', children: (
      <>
        <Card className="mb-6 rounded-xl shadow-md bg-white" styles={cardStyles}>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Sản Phẩm Bán Chạy</h3>
          <Row gutter={[16,16]} className="mb-4">
            <Col xs={24} md={8}>
              <Select value={topSanPham} onChange={setTopSanPham} className="w-full" placeholder="Số lượng sản phẩm">
                <Option value={1}>Top 1</Option>
                <Option value={5}>Top 5</Option>
                <Option value={10}>Top 10</Option>
                <Option value={20}>Top 20</Option>
                <Option value={30}>Top 30</Option>
              </Select>
            </Col>
            <Col xs={24} md={16}>
              <DateRangeFilter value={dateSanPham} onChange={d=> setDateSanPham(d||[null,null])} />
            </Col>
          </Row>
          <Table columns={banChayColumns} dataSource={sanPhamBanChay} rowKey="uniqueKey" className="rounded-lg overflow-hidden" />
        </Card>
        <Card className="mb-6 rounded-xl shadow-md bg-white" styles={cardStyles}>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Sản Phẩm Tồn Kho Thấp</h3>
          <Select value={nguongTonKho} onChange={setNguongTonKho} className="w-32 mb-4" placeholder="Ngưỡng tồn kho">
            <Option value={5}>5</Option>
            <Option value={10}>10</Option>
            <Option value={20}>20</Option>
            <Option value={30}>30</Option>
          </Select>
          <Table columns={tonKhoThapColumns} dataSource={sanPhamTonKhoThap} rowKey="uniqueKey" className="rounded-lg overflow-hidden" />
        </Card>
        <Card className="rounded-xl shadow-md bg-white" styles={cardStyles}>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Sản Phẩm Tồn Kho Lâu</h3>
          <Select value={soNgayTonKhoLau} onChange={setSoNgayTonKhoLau} className="w-32 mb-4" placeholder="Số ngày tồn kho">
            <Option value={15}>15 ngày</Option>
            <Option value={30}>30 ngày</Option>
            <Option value={60}>60 ngày</Option>
            <Option value={90}>90 ngày</Option>
          </Select>
          <Table columns={tonKhoLauColumns} dataSource={sanPhamTonKhoLau} rowKey="uniqueKey" className="rounded-lg overflow-hidden" />
        </Card>
      </>
    )},
    { key: 'khach-hang', label: 'Khách Hàng', children: (
      <Card className="mb-6 rounded-xl shadow-md bg-white" styles={cardStyles}>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Khách Hàng Thân Thiết</h3>
        <Row gutter={[16,16]} className="mb-4">
          <Col xs={24}>
            <DateRangeFilter value={dateKhachHang} onChange={d=> setDateKhachHang(d||[null,null])} />
          </Col>
        </Row>
        <Table columns={khachHangColumns} dataSource={khachHangThanThiet} rowKey="maKhachHang" className="rounded-lg overflow-hidden" />
      </Card>
    )},
    { key: 'khuyen-mai', label: 'Khuyến Mãi & Thanh Toán', children: (
      <>
        <Card className="mb-6 rounded-xl shadow-md bg-white" styles={cardStyles}>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Phương Thức Thanh Toán</h3>
          <Row gutter={[16,16]} className="mb-4">
            <Col xs={24}>
              <DateRangeFilter value={datePhuongThuc} onChange={d=> setDatePhuongThuc(d||[null,null])} />
            </Col>
          </Row>
          <Table columns={phuongThucThanhToanColumns} dataSource={phuongThucThanhToan} rowKey="phuongThuc" className="rounded-lg overflow-hidden" />
        </Card>
        <Card className="mb-6 rounded-xl shadow-md bg-white" styles={cardStyles}>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Khuyến Mãi</h3>
          <Row gutter={[16,16]} className="mb-4">
            <Col xs={24}>
              <DateRangeFilter value={dateKhuyenMai} onChange={d=> setDateKhuyenMai(d||[null,null])} />
            </Col>
          </Row>
          <Table columns={khuyenMaiColumns} dataSource={khuyenMai} rowKey="maKhuyenMai" className="rounded-lg overflow-hidden" />
        </Card>
        <Card className="mb-6 rounded-xl shadow-md bg-white" styles={cardStyles}>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Đơn Hàng Theo Trạng Thái</h3>
          <Row gutter={[16,16]} className="mb-4">
            <Col xs={24}>
              <DateRangeFilter value={dateDonHangTrangThai} onChange={d=> setDateDonHangTrangThai(d||[null,null])} />
            </Col>
          </Row>
          <div style={{ height:300, maxWidth:500, margin:'0 auto' }}>
            <Pie data={chartDataDonHangTrangThai} options={chartOptionsDonHangTrangThai} />
          </div>
          <Table columns={donHangTrangThaiColumns} dataSource={donHangTheoTrangThai} rowKey="trangThai" className="rounded-lg overflow-hidden mt-4" />
        </Card>
        <Card className="rounded-xl shadow-md bg-white" styles={cardStyles}>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Đơn Hàng Theo Thời Gian</h3>
          <Row gutter={[16,16]} className="mb-4">
            <Col xs={24}>
              <DateRangeFilter value={dateDonHangThoiGian} onChange={d=> setDateDonHangThoiGian(d||[null,null])} />
            </Col>
          </Row>
          <Bar data={chartDataDonHangThoiGian} options={chartOptionsDonHangThoiGian} />
          <Table columns={donHangThoiGianColumns} dataSource={donHangTheoThoiGian} rowKey="ngay" className="rounded-lg overflow-hidden mt-4" />
        </Card>
      </>
    )},
    { key: 'nhan-vien', label: 'Nhân Viên', children: (
      <Card className="mb-6 rounded-xl shadow-md bg-white" styles={cardStyles}>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Nhân Viên Bán Hàng</h3>
        <Row gutter={[16,16]} className="mb-4">
          <Col xs={24}>
            <DateRangeFilter value={dateNhanVien} onChange={d=> setDateNhanVien(d||[null,null])} />
          </Col>
        </Row>
        <Table columns={nhanVienBanHangColumns} dataSource={nhanVienBanHang} rowKey="maNhanVien" className="rounded-lg overflow-hidden" />
      </Card>
    )}
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">Thống Kê Quản Trị</h1>
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="bg-white rounded-xl shadow-lg" tabBarStyle={{ padding:'0 16px', fontWeight:'600', color:'#1f2937' }} items={items} />
    </div>
  );
};

export default ThongKeAdmin;
