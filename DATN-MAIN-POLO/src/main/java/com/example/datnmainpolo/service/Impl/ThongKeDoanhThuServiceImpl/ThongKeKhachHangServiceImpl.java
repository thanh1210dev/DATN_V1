package com.example.datnmainpolo.service.Impl.ThongKeDoanhThuServiceImpl;


import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.KhachHangThanThietDTO;
import com.example.datnmainpolo.repository.ThongKeRepo.NguoiDungRepository;
import com.example.datnmainpolo.service.ThongKeKhachHangService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ThongKeKhachHangServiceImpl implements ThongKeKhachHangService {

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @Override
    public List<KhachHangThanThietDTO> layKhachHangThanThiet(Integer top, LocalDate ngayBatDau, LocalDate ngayKetThuc) {
        List<Object[]> ketQua = nguoiDungRepository.timKhachHangThanThiet(ngayBatDau, ngayKetThuc, top);
        List<KhachHangThanThietDTO> danhSachDTO = new ArrayList<>();
        for (Object[] row : ketQua) {
            KhachHangThanThietDTO dto = new KhachHangThanThietDTO();
            dto.setMaKhachHang((String) row[0]);
            dto.setTenKhachHang((String) row[1]);
            dto.setSoLuongDonHang((Long) row[2]);
            dto.setTongChiTieu((BigDecimal) row[3]);
            danhSachDTO.add(dto);
        }
        return danhSachDTO;
    }
}