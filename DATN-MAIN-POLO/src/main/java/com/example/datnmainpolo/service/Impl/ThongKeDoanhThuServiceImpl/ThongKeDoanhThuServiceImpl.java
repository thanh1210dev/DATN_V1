package com.example.datnmainpolo.service.Impl.ThongKeDoanhThuServiceImpl;

import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.*;
import com.example.datnmainpolo.repository.ThongKeRepo.HoaDonRepository;
import com.example.datnmainpolo.service.ThongKeDoanhThuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
public class ThongKeDoanhThuServiceImpl implements ThongKeDoanhThuService {

    @Autowired
    private HoaDonRepository hoaDonRepository;

    @Override
    public List<ThongKeDoanhThuDTO> layDoanhThuTheoThoiGian(YeuCauDoanhThuDTO yeuCau) {
        if (yeuCau == null) {
            return new ArrayList<>();
        }
        Instant ngayBatDau = yeuCau.getNgayBatDau();
        Instant ngayKetThuc = yeuCau.getNgayKetThuc();
        String billType = yeuCau.getBillType();

        List<Object[]> ketQua;
        try {
            ketQua = hoaDonRepository.timDoanhThuTheoDonViThoiGian("PAID", ngayBatDau, ngayKetThuc, billType);
        } catch (Exception e) {
            System.err.println("Error fetching revenue: " + e.getMessage());
            return new ArrayList<>();
        }

        List<ThongKeDoanhThuDTO> danhSachDTO = new ArrayList<>();
        for (Object[] row : ketQua) {
            ThongKeDoanhThuDTO dto = new ThongKeDoanhThuDTO();
            Date ngaySql = (Date) row[0];
            dto.setNgay(ngaySql.toLocalDate().atStartOfDay(ZoneId.systemDefault()).toInstant());
            dto.setTongDoanhThu((BigDecimal) row[1]);
            dto.setSoLuongDonHang(((Number) row[2]).longValue());
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }

    @Override
    public ThongKeDoanhThuDTO layDoanhThuHomNay() {
        Instant ngay = Instant.now();
        Instant startOfDay = ngay.atZone(ZoneId.systemDefault()).toLocalDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfDay = ngay.atZone(ZoneId.systemDefault()).toLocalDate().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        List<Object[]> ketQua;
        try {
            ketQua = hoaDonRepository.timDoanhThuTheoDonViThoiGian("PAID", startOfDay, endOfDay, null);
        } catch (Exception e) {
            System.err.println("Error fetching today's revenue: " + e.getMessage());
            ThongKeDoanhThuDTO dto = new ThongKeDoanhThuDTO();
            dto.setNgay(ngay);
            dto.setTongDoanhThu(BigDecimal.ZERO);
            dto.setSoLuongDonHang(0L);
            return dto;
        }

        ThongKeDoanhThuDTO dto = new ThongKeDoanhThuDTO();
        dto.setNgay(ngay);
        dto.setTongDoanhThu(BigDecimal.ZERO);
        dto.setSoLuongDonHang(0L);

        if (!ketQua.isEmpty()) {
            Object[] row = ketQua.get(0);
            dto.setTongDoanhThu((BigDecimal) row[1]);
            dto.setSoLuongDonHang(((Number) row[2]).longValue());
        }
        return dto;
    }

    @Override
    public List<NhanVienBanHangDTO> thongKeNhanVienBanHang(Instant ngayBatDau, Instant ngayKetThuc) {
        List<Object[]> ketQua;
        try {
            ketQua = hoaDonRepository.thongKeNhanVienBanHang(ngayBatDau, ngayKetThuc);
        } catch (Exception e) {
            System.err.println("Error fetching employee sales: " + e.getMessage());
            return new ArrayList<>();
        }

        List<NhanVienBanHangDTO> danhSachDTO = new ArrayList<>();
        for (Object[] row : ketQua) {
            NhanVienBanHangDTO dto = new NhanVienBanHangDTO();
            dto.setMaNhanVien((String) row[0]);
            dto.setTenNhanVien((String) row[1]);
            dto.setSoLuongDonHang(((Number) row[2]).longValue());
            dto.setTongDoanhThu((BigDecimal) row[3]);
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }

    @Override
    public List<SoSanhDoanhThuDTO> soSanhDoanhThu(String ky) {
        List<SoSanhDoanhThuDTO> danhSach = new ArrayList<>();
        Instant ngayHienTai = Instant.now();
        ZoneId zoneId = ZoneId.systemDefault();

        try {
            if ("NGAY".equalsIgnoreCase(ky)) {
                Instant dauNgayNay = ngayHienTai.atZone(zoneId).toLocalDate().atStartOfDay(zoneId).toInstant();
                Instant cuoiNgayNay = ngayHienTai.atZone(zoneId).toLocalDate().atTime(23, 59, 59).atZone(zoneId).toInstant();
                Instant dauNgayTruoc = dauNgayNay.atZone(zoneId).minusDays(1).toInstant();
                Instant cuoiNgayTruoc = cuoiNgayNay.atZone(zoneId).minusDays(1).toInstant();

                BigDecimal doanhThuNgayNay = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                                "PAID", dauNgayNay, cuoiNgayNay, null)
                        .stream().map(row -> (BigDecimal) row[1]).reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal doanhThuNgayTruoc = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                                "PAID", dauNgayTruoc, cuoiNgayTruoc, null)
                        .stream().map(row -> (BigDecimal) row[1]).reduce(BigDecimal.ZERO, BigDecimal::add);

                SoSanhDoanhThuDTO ngayNay = new SoSanhDoanhThuDTO();
                ngayNay.setKy("Hôm nay");
                ngayNay.setDoanhThu(doanhThuNgayNay);

                SoSanhDoanhThuDTO ngayTruoc = new SoSanhDoanhThuDTO();
                ngayTruoc.setKy("Hôm qua");
                ngayTruoc.setDoanhThu(doanhThuNgayTruoc);

                double tyLe = doanhThuNgayTruoc.compareTo(BigDecimal.ZERO) != 0 ?
                        doanhThuNgayNay.subtract(doanhThuNgayTruoc).doubleValue() / doanhThuNgayTruoc.doubleValue() * 100 : 0;
                ngayNay.setTyLeTangTruong(tyLe);

                danhSach.add(ngayNay);
                danhSach.add(ngayTruoc);
            } else if ("THANG".equalsIgnoreCase(ky)) {
                Instant dauThangNay = ngayHienTai.atZone(zoneId).withDayOfMonth(1).toInstant();
                Instant cuoiThangNay = ngayHienTai.atZone(zoneId).withDayOfMonth(
                        ngayHienTai.atZone(zoneId).toLocalDate().lengthOfMonth()).withHour(23).withMinute(59).withSecond(59).toInstant();
                Instant dauThangTruoc = dauThangNay.atZone(zoneId).minusMonths(1).toInstant();
                Instant cuoiThangTruoc = dauThangTruoc.atZone(zoneId).withDayOfMonth(
                        dauThangTruoc.atZone(zoneId).toLocalDate().lengthOfMonth()).withHour(23).withMinute(59).withSecond(59).toInstant();

                BigDecimal doanhThuThangNay = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                                "PAID", dauThangNay, cuoiThangNay, null)
                        .stream().map(row -> (BigDecimal) row[1]).reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal doanhThuThangTruoc = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                                "PAID", dauThangTruoc, cuoiThangTruoc, null)
                        .stream().map(row -> (BigDecimal) row[1]).reduce(BigDecimal.ZERO, BigDecimal::add);

                SoSanhDoanhThuDTO thangNay = new SoSanhDoanhThuDTO();
                thangNay.setKy("Tháng này");
                thangNay.setDoanhThu(doanhThuThangNay);

                SoSanhDoanhThuDTO thangTruoc = new SoSanhDoanhThuDTO();
                thangTruoc.setKy("Tháng trước");
                thangTruoc.setDoanhThu(doanhThuThangTruoc);

                double tyLe = doanhThuThangTruoc.compareTo(BigDecimal.ZERO) != 0 ?
                        doanhThuThangNay.subtract(doanhThuThangTruoc).doubleValue() / doanhThuThangTruoc.doubleValue() * 100 : 0;
                thangNay.setTyLeTangTruong(tyLe);

                danhSach.add(thangNay);
                danhSach.add(thangTruoc);
            } else if ("QUY".equalsIgnoreCase(ky)) {
                Instant dauQuyNay = ngayHienTai.atZone(zoneId).withMonth(((ngayHienTai.atZone(zoneId).getMonthValue() - 1) / 3) * 3 + 1)
                        .withDayOfMonth(1).toInstant();
                Instant cuoiQuyNay = dauQuyNay.atZone(zoneId).plusMonths(2).withDayOfMonth(
                        dauQuyNay.atZone(zoneId).plusMonths(2).toLocalDate().lengthOfMonth()).withHour(23).withMinute(59).withSecond(59).toInstant();
                Instant dauQuyTruoc = dauQuyNay.atZone(zoneId).minusMonths(3).toInstant();
                Instant cuoiQuyTruoc = dauQuyTruoc.atZone(zoneId).plusMonths(2).withDayOfMonth(
                        dauQuyTruoc.atZone(zoneId).plusMonths(2).toLocalDate().lengthOfMonth()).withHour(23).withMinute(59).withSecond(59).toInstant();

                BigDecimal doanhThuQuyNay = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                                "PAID", dauQuyNay, cuoiQuyNay, null)
                        .stream().map(row -> (BigDecimal) row[1]).reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal doanhThuQuyTruoc = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                                "PAID", dauQuyTruoc, cuoiQuyTruoc, null)
                        .stream().map(row -> (BigDecimal) row[1]).reduce(BigDecimal.ZERO, BigDecimal::add);

                SoSanhDoanhThuDTO quyNay = new SoSanhDoanhThuDTO();
                quyNay.setKy("Quý này");
                quyNay.setDoanhThu(doanhThuQuyNay);

                SoSanhDoanhThuDTO quyTruoc = new SoSanhDoanhThuDTO();
                quyTruoc.setKy("Quý trước");
                quyTruoc.setDoanhThu(doanhThuQuyTruoc);

                double tyLe = doanhThuQuyTruoc.compareTo(BigDecimal.ZERO) != 0 ?
                        doanhThuQuyNay.subtract(doanhThuQuyTruoc).doubleValue() / doanhThuQuyTruoc.doubleValue() * 100 : 0;
                quyNay.setTyLeTangTruong(tyLe);

                danhSach.add(quyNay);
                danhSach.add(quyTruoc);
            } else if ("NAM".equalsIgnoreCase(ky)) {
                Instant dauNamNay = ngayHienTai.atZone(zoneId).withDayOfYear(1).toInstant();
                Instant cuoiNamNay = ngayHienTai.atZone(zoneId).withMonth(12).withDayOfMonth(31)
                        .withHour(23).withMinute(59).withSecond(59).toInstant();
                Instant dauNamTruoc = dauNamNay.atZone(zoneId).minusYears(1).toInstant();
                Instant cuoiNamTruoc = dauNamTruoc.atZone(zoneId).withMonth(12).withDayOfMonth(31)
                        .withHour(23).withMinute(59).withSecond(59).toInstant();

                BigDecimal doanhThuNamNay = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                                "PAID", dauNamNay, cuoiNamNay, null)
                        .stream().map(row -> (BigDecimal) row[1]).reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal doanhThuNamTruoc = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                                "PAID", dauNamTruoc, cuoiNamTruoc, null)
                        .stream().map(row -> (BigDecimal) row[1]).reduce(BigDecimal.ZERO, BigDecimal::add);

                SoSanhDoanhThuDTO namNay = new SoSanhDoanhThuDTO();
                namNay.setKy("Năm này");
                namNay.setDoanhThu(doanhThuNamNay);

                SoSanhDoanhThuDTO namTruoc = new SoSanhDoanhThuDTO();
                namTruoc.setKy("Năm trước");
                namTruoc.setDoanhThu(doanhThuNamTruoc);

                double tyLe = doanhThuNamTruoc.compareTo(BigDecimal.ZERO) != 0 ?
                        doanhThuNamNay.subtract(doanhThuNamTruoc).doubleValue() / doanhThuNamTruoc.doubleValue() * 100 : 0;
                namNay.setTyLeTangTruong(tyLe);

                danhSach.add(namNay);
                danhSach.add(namTruoc);
            }
        } catch (Exception e) {
            System.err.println("Error comparing revenue: " + e.getMessage());
        }
        return danhSach;
    }

    @Override
    public List<PhuongThucThanhToanDTO> thongKePhuongThucThanhToan(Instant ngayBatDau, Instant ngayKetThuc) {
        List<Object[]> ketQua;
        try {
            ketQua = hoaDonRepository.thongKePhuongThucThanhToan(ngayBatDau, ngayKetThuc);
        } catch (Exception e) {
            System.err.println("Error fetching payment methods: " + e.getMessage());
            return new ArrayList<>();
        }

        List<PhuongThucThanhToanDTO> danhSachDTO = new ArrayList<>();
        BigDecimal tongDoanhThuTatCa = ketQua.stream()
                .map(row -> (BigDecimal) row[2])
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        for (Object[] row : ketQua) {
            PhuongThucThanhToanDTO dto = new PhuongThucThanhToanDTO();
            dto.setPhuongThuc((String) row[0]);
            dto.setSoLuongDonHang(((Number) row[1]).longValue());
            dto.setTongDoanhThu((BigDecimal) row[2]);
            double tyLe = tongDoanhThuTatCa.compareTo(BigDecimal.ZERO) != 0 ?
                    dto.getTongDoanhThu().doubleValue() / tongDoanhThuTatCa.doubleValue() * 100 : 0;
            dto.setTyLe(tyLe);
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }

    @Override
    public List<KhuyenMaiDTO> thongKeKhuyenMai(Instant ngayBatDau, Instant ngayKetThuc) {
        List<Object[]> ketQua;
        try {
            ketQua = hoaDonRepository.thongKeKhuyenMai(ngayBatDau, ngayKetThuc);
        } catch (Exception e) {
            System.err.println("Error fetching promotions: " + e.getMessage());
            return new ArrayList<>();
        }

        List<KhuyenMaiDTO> danhSachDTO = new ArrayList<>();
        for (Object[] row : ketQua) {
            KhuyenMaiDTO dto = new KhuyenMaiDTO();
            dto.setMaKhuyenMai((String) row[0]);
            dto.setTenKhuyenMai((String) row[1]);
            dto.setSoLanSuDung(((Number) row[2]).longValue());
            dto.setTongDoanhThu((BigDecimal) row[3]);
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }

    @Override
    public List<DonHangTheoTrangThaiDTO> thongKeDonHangTheoTrangThai(Instant ngayBatDau, Instant ngayKetThuc) {
        List<Object[]> ketQua;
        try {
            ketQua = hoaDonRepository.thongKeDonHangTheoTrangThai(ngayBatDau, ngayKetThuc);
        } catch (Exception e) {
            System.err.println("Error fetching order status: " + e.getMessage());
            return new ArrayList<>();
        }

        List<DonHangTheoTrangThaiDTO> danhSachDTO = new ArrayList<>();
        for (Object[] row : ketQua) {
            DonHangTheoTrangThaiDTO dto = new DonHangTheoTrangThaiDTO();
            dto.setTrangThai((String) row[0]);
            dto.setSoLuongDonHang(((Number) row[1]).longValue());
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }

    @Override
    public List<DonHangTheoThoiGianDTO> thongKeDonHangTheoThoiGian(Instant ngayBatDau, Instant ngayKetThuc) {
        List<Object[]> ketQua;
        try {
            ketQua = hoaDonRepository.thongKeDonHangTheoThoiGian(ngayBatDau, ngayKetThuc);
        } catch (Exception e) {
            System.err.println("Error fetching orders by time: " + e.getMessage());
            return new ArrayList<>();
        }

        List<DonHangTheoThoiGianDTO> danhSachDTO = new ArrayList<>();
        for (Object[] row : ketQua) {
            DonHangTheoThoiGianDTO dto = new DonHangTheoThoiGianDTO();
            Date ngaySql = (Date) row[0];
            dto.setNgay(ngaySql.toLocalDate().atStartOfDay(ZoneId.systemDefault()).toInstant());
            dto.setSoLuongDonHang(((Number) row[1]).longValue());
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }

    @Override
    public Page<KhachHangThanThietDTO> timKhachHangThanThiet(
            String code, String name, String phoneNumber, String email,
            Instant startDate, Instant endDate, Boolean isBirthday,
            Integer minPoints, Integer maxPoints, String memberTier,
            Pageable pageable
    ) {
        try {
            return hoaDonRepository.timKhachHangThanThiet(
                    code, name, phoneNumber, email, startDate, endDate,
                    isBirthday, minPoints, maxPoints, memberTier, pageable
            );
        } catch (Exception e) {
            System.err.println("Error fetching loyal customers: " + e.getMessage());
            return Page.empty(pageable);
        }
    }
}