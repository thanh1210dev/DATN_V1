package com.example.datnmainpolo.service.Impl.ThongKeDoanhThuServiceImpl;


import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SanPhamBanChayDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SanPhamTonKhoLauDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SanPhamTonKhoThapDTO;
import com.example.datnmainpolo.repository.ThongKeRepo.ChiTietSanPhamRepository;
import com.example.datnmainpolo.service.ThongKeSanPhamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;


@Service
public class ThongKeSanPhamServiceImpl implements ThongKeSanPhamService {

    @Autowired
    private ChiTietSanPhamRepository chiTietSanPhamRepository;

    @Override
    public List<SanPhamBanChayDTO> laySanPhamBanChay(Integer top, Instant ngayBatDau, Instant ngayKetThuc) {
        List<Object[]> ketQua = chiTietSanPhamRepository.timSanPhamBanChay(ngayBatDau, ngayKetThuc, top);
        List<SanPhamBanChayDTO> danhSachDTO = new ArrayList<>();
        for (Object[] row : ketQua) {
            SanPhamBanChayDTO dto = new SanPhamBanChayDTO();
            dto.setMaSanPham((String) row[0]);
            dto.setTenSanPham((String) row[1]);
            dto.setMauSac((String) row[2]);
            dto.setKichCo((String) row[3]);
            dto.setSoLuongBan(((Number) row[4]).longValue());
            dto.setDoanhThu((BigDecimal) row[5]);
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }

    @Override
    public List<SanPhamTonKhoThapDTO> laySanPhamTonKhoThap(Integer nguongToiThieu) {
        List<Object[]> ketQua = chiTietSanPhamRepository.timSanPhamTonKhoThap(nguongToiThieu);
        List<SanPhamTonKhoThapDTO> danhSachDTO = new ArrayList<>();
        for (Object[] row : ketQua) {
            SanPhamTonKhoThapDTO dto = new SanPhamTonKhoThapDTO();
            dto.setMaSanPham((String) row[0]);
            dto.setTenSanPham((String) row[1]);
            dto.setSoLuongTon(((Number) row[2]).longValue());
            dto.setNguongToiThieu(nguongToiThieu);
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }

    @Override
    public List<SanPhamTonKhoLauDTO> laySanPhamTonKhoLau(Integer soNgay) {
        Instant ngayToiDa = Instant.now().minusSeconds(soNgay * 24 * 60 * 60L);
        List<Object[]> ketQua = chiTietSanPhamRepository.timSanPhamTonKhoLau(ngayToiDa);
        List<SanPhamTonKhoLauDTO> danhSachDTO = new ArrayList<>();
        for (Object[] row : ketQua) {
            SanPhamTonKhoLauDTO dto = new SanPhamTonKhoLauDTO();
            dto.setMaSanPham((String) row[0]);
            dto.setTenSanPham((String) row[1]);
            dto.setSoLuongTon(((Number) row[2]).longValue());
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }
}