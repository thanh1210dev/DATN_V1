package com.example.datnmainpolo.service.Impl.ThongKeDoanhThuServiceImpl;



import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.DonHangTheoThoiGianDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.DonHangTheoTrangThaiDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.KhachHangThanThietDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.KhuyenMaiDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.PhuongThucThanhToanDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SoSanhDoanhThuDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.ThongKeDoanhThuDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.YeuCauDoanhThuDTO;
import com.example.datnmainpolo.repository.ThongKeRepo.HoaDonRepository;
import com.example.datnmainpolo.service.ThongKeDoanhThuService;
import org.springframework.beans.factory.annotation.Autowired;
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
        Instant ngayBatDau = yeuCau.getNgayBatDau();
        Instant ngayKetThuc = yeuCau.getNgayKetThuc();

        List<Object[]> ketQua = hoaDonRepository.timDoanhThuTheoDonViThoiGian("COMPLETED", ngayBatDau, ngayKetThuc);

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

        List<Object[]> ketQua = hoaDonRepository.timDoanhThuTheoDonViThoiGian("COMPLETED", startOfDay, endOfDay);
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
    public List<SoSanhDoanhThuDTO> soSanhDoanhThu(String ky) {
        List<SoSanhDoanhThuDTO> danhSach = new ArrayList<>();
        Instant ngayHienTai = Instant.now();
        ZoneId zoneId = ZoneId.systemDefault();

        if ("THANG".equalsIgnoreCase(ky)) {
            Instant dauThangNay = ngayHienTai.atZone(zoneId).withDayOfMonth(1).toInstant();
            Instant cuoiThangNay = ngayHienTai.atZone(zoneId).withDayOfMonth(
                    ngayHienTai.atZone(zoneId).toLocalDate().lengthOfMonth()).withHour(23).withMinute(59).withSecond(59).toInstant();
            Instant dauThangTruoc = dauThangNay.atZone(zoneId).minusMonths(1).toInstant();
            Instant cuoiThangTruoc = dauThangTruoc.atZone(zoneId).withDayOfMonth(
                    dauThangTruoc.atZone(zoneId).toLocalDate().lengthOfMonth()).withHour(23).withMinute(59).withSecond(59).toInstant();

            BigDecimal doanhThuThangNay = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                            "COMPLETED", dauThangNay, cuoiThangNay)
                    .stream().map(row -> (BigDecimal) row[1]).reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal doanhThuThangTruoc = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                            "COMPLETED", dauThangTruoc, cuoiThangTruoc)
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
                            "COMPLETED", dauQuyNay, cuoiQuyNay)
                    .stream().map(row -> (BigDecimal) row[1]).reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal doanhThuQuyTruoc = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                            "COMPLETED", dauQuyTruoc, cuoiQuyTruoc)
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
                            "COMPLETED", dauNamNay, cuoiNamNay)
                    .stream().map(row -> (BigDecimal) row[1]).reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal doanhThuNamTruoc = hoaDonRepository.timDoanhThuTheoDonViThoiGian(
                            "COMPLETED", dauNamTruoc, cuoiNamTruoc)
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
        return danhSach;
    }

    @Override
    public List<PhuongThucThanhToanDTO> thongKePhuongThucThanhToan() {
        List<Object[]> ketQua = hoaDonRepository.thongKePhuongThucThanhToan();
        List<PhuongThucThanhToanDTO> danhSachDTO = new ArrayList<>();
        for (Object[] row : ketQua) {
            PhuongThucThanhToanDTO dto = new PhuongThucThanhToanDTO();
            dto.setPhuongThuc((String) row[0]);
            dto.setSoLuongDonHang(((Number) row[1]).longValue());
            dto.setTongDoanhThu((BigDecimal) row[2]);
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }

    @Override
    public List<KhuyenMaiDTO> thongKeKhuyenMai(Instant ngayBatDau, Instant ngayKetThuc) {
        List<Object[]> ketQua = hoaDonRepository.thongKeKhuyenMai(ngayBatDau, ngayKetThuc);
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
    public List<DonHangTheoTrangThaiDTO> thongKeDonHangTheoTrangThai() {
        List<Object[]> ketQua = hoaDonRepository.thongKeDonHangTheoTrangThai();
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
        List<Object[]> ketQua = hoaDonRepository.thongKeDonHangTheoThoiGian(ngayBatDau, ngayKetThuc);
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
    public List<KhachHangThanThietDTO> timKhachHangThanThiet(Integer top, Instant ngayBatDau, Instant ngayKetThuc) {
        List<Object[]> ketQua = hoaDonRepository.timKhachHangThanThiet(ngayBatDau, ngayKetThuc, top);
        List<KhachHangThanThietDTO> danhSachDTO = new ArrayList<>();
        for (Object[] row : ketQua) {
            KhachHangThanThietDTO dto = new KhachHangThanThietDTO();
            dto.setMaKhachHang((String) row[0]);
            dto.setTenKhachHang((String) row[1]);
            dto.setSoLuongDonHang(((Number) row[2]).longValue());
            dto.setTongChiTieu((BigDecimal) row[3]);
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }
}