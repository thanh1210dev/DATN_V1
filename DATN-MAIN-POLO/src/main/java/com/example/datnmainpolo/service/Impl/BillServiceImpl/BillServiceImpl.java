package com.example.datnmainpolo.service.Impl.BillServiceImpl;

import com.example.datnmainpolo.dto.BillDTO.BillRequestDTO;
import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.BillDetail;
import com.example.datnmainpolo.entity.Voucher;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.repository.*;
import com.example.datnmainpolo.service.BillDetailService;
import com.example.datnmainpolo.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillServiceImpl implements BillService {
    private final BillRepository billRepository;
    private final UserRepository userRepository;
    private final CustomerInformationRepository customerInformationRepository;
    private final BillDetailRepository billDetailRepository;
    private final VoucherRepository voucherRepository;
    //admin bill
    @Override
    public PaginationResponse<BillResponseDTO> getAllByStatusAndDeletedFalse(OrderStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Bill> pageData = billRepository.findAllByStatusAndDeletedFalse(status,pageable);

        Page<BillResponseDTO> dtoPage = pageData.map(bill -> BillResponseDTO.builder()
                .id(bill.getId())
                .code(bill.getCode())
                .status(bill.getStatus())
                .customerName(bill.getCustomerName())
                .phoneNumber(bill.getPhoneNumber())
                .address(bill.getAddress())
                .totalMoney(bill.getTotalMoney())
                .reductionAmount(bill.getReductionAmount())
                .moneyShip(bill.getMoneyShip())
                .finalAmount(
                        (bill.getTotalMoney() != null ? bill.getTotalMoney() : BigDecimal.ZERO)
                                .subtract(bill.getReductionAmount() != null ? bill.getReductionAmount() : BigDecimal.ZERO)
                                .add(bill.getMoneyShip() != null ? bill.getMoneyShip() : BigDecimal.ZERO)
                )
                .createdAt(bill.getCreatedAt())
                .employeeName(bill.getEmployee() != null ? bill.getEmployee().getName() : null)
                .type(bill.getType())
                .createdBy(bill.getCreatedBy())
                .updatedBy(bill.getUpdatedBy())
                .build());
        return new PaginationResponse<>(dtoPage);
    }



    @Override
    @Transactional
    public BillResponseDTO createBillAdmin(BillRequestDTO request) {
        Bill bill = new Bill();
        bill.setCode("BILL" + System.currentTimeMillis());
        bill.setStatus(OrderStatus.PENDING);
        bill.setCustomerName(request.getCustomerName());
        bill.setPhoneNumber(request.getPhoneNumber());
        bill.setAddress(request.getAddress());
        BigDecimal totalMoney = calculateTotalMoney(request);
        BigDecimal moneyShip = request.getMoneyShip() != null ? request.getMoneyShip() : BigDecimal.ZERO;
//      Lấy voucher và tính toán giá trị giảm giá
        BigDecimal reductionAmount = BigDecimal.ZERO;
        if (request.getVoucherId() != null) {
            Voucher voucher = voucherRepository.findById(request.getVoucherId())
                    .orElseThrow(() -> new RuntimeException("Voucher not found"));

            // Kiểm tra loại giảm giá của voucher (giảm theo phần trăm hoặc theo giá trị cố định)
            if ("PERCENT".equals(voucher.getType())) {
                reductionAmount = bill.getTotalMoney().multiply(voucher.getPercentageDiscountValue().divide(BigDecimal.valueOf(100)));
                if (voucher.getMaxDiscountValue() != null && reductionAmount.compareTo(voucher.getMaxDiscountValue()) > 0) {
                    reductionAmount = voucher.getMaxDiscountValue();
                }
            } else if ("FIXED".equals(voucher.getType())) {
                reductionAmount = voucher.getFixedDiscountValue();
            }
        }

        bill.setTotalMoney(totalMoney);
        bill.setMoneyShip(moneyShip);
        bill.setReductionAmount(reductionAmount);
        bill.setDeposit(request.getDeposit());
        bill.setType(request.getType());
        bill.setCreatedAt(Instant.now());
        bill.setUpdatedAt(Instant.now());
        bill.setCreatedBy("system"); // hoặc lấy từ SecurityContext sau này
        bill.setUpdatedBy("system");
        bill.setDeleted(false);





        bill.setCustomer(userRepository.findById(request.getCustomerId()).orElse(null));
        bill.setEmployee(userRepository.findById(request.getEmployeeId()).orElse(null));
        bill.setCustomerInfor(customerInformationRepository.findById(request.getCustomerInforId()).orElse(null));
        Bill saved = billRepository.save(bill);

        // Trả response
        return BillResponseDTO.builder()
                .id(saved.getId())
                .code(saved.getCode())
                .status(saved.getStatus())
                .customerName(saved.getCustomerName())
                .phoneNumber(saved.getPhoneNumber())
                .address(saved.getAddress())
                .totalMoney(saved.getTotalMoney())
                .moneyShip(saved.getMoneyShip())
                .reductionAmount(saved.getReductionAmount())
                .finalAmount(saved.getTotalMoney()
                        .subtract(saved.getReductionAmount() != null ? saved.getReductionAmount() : BigDecimal.ZERO)
                        .add(saved.getMoneyShip() != null ? saved.getMoneyShip() : BigDecimal.ZERO))
                .createdAt(saved.getCreatedAt())
                .employeeName(saved.getEmployee() != null ? saved.getEmployee().getName() : null)
                .type(saved.getType())
                .createdBy(saved.getCreatedBy())
                .updatedBy(saved.getUpdatedBy())
                .build();
    }

    @Override
    public BillResponseDTO updateBillAdmin(Integer billId, BillRequestDTO request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found with id: " + billId));

        bill.setCustomerName(request.getCustomerName());
        bill.setPhoneNumber(request.getPhoneNumber());
        bill.setAddress(request.getAddress());
        bill.setTotalMoney(request.getTotalMoney());
        bill.setMoneyShip(request.getMoneyShip());
        bill.setReductionAmount(request.getReductionAmount());
        bill.setDeposit(request.getDeposit());
        bill.setType(request.getType());
        bill.setStatus(request.getStatus());
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system"); // sau có thể lấy từ SecurityContext

        bill.setCustomer(userRepository.findById(request.getCustomerId()).orElse(null));
        bill.setEmployee(userRepository.findById(request.getEmployeeId()).orElse(null));
        bill.setCustomerInfor(customerInformationRepository.findById(request.getCustomerInforId()).orElse(null));

        Bill updated = billRepository.save(bill);

        return BillResponseDTO.builder()
                .id(updated.getId())
                .code(updated.getCode())
                .status(updated.getStatus())
                .customerName(updated.getCustomerName())
                .phoneNumber(updated.getPhoneNumber())
                .address(updated.getAddress())
                .totalMoney(updated.getTotalMoney())
                .moneyShip(updated.getMoneyShip())
                .reductionAmount(updated.getReductionAmount())
                .finalAmount(updated.getTotalMoney()
                        .subtract(updated.getReductionAmount() != null ? updated.getReductionAmount() : BigDecimal.ZERO)
                        .add(updated.getMoneyShip() != null ? updated.getMoneyShip() : BigDecimal.ZERO))
                .createdAt(updated.getCreatedAt())
                .employeeName(updated.getEmployee() != null ? updated.getEmployee().getName() : null)
                .type(updated.getType())
                .createdBy(updated.getCreatedBy())
                .updatedBy(updated.getUpdatedBy())
                .build();
    }

    @Override
    public void deleteBill(Integer billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found with id: " + billId));

        bill.setDeleted(true);
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system"); // hoặc từ SecurityContext

        billRepository.save(bill);
    }

    // client bill
    @Override
    public PaginationResponse<BillResponseDTO> findAllByCustomerIdAndDeletedFalse(Integer customerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Bill> pageData = billRepository.findAllByCustomerIdAndDeletedFalse(customerId,pageable);
        Page<BillResponseDTO> dtoPage = pageData.map(bill -> BillResponseDTO.builder()
                .id(bill.getId())
                .code(bill.getCode())
                .status(bill.getStatus())
                .customerName(bill.getCustomerName())
                .phoneNumber(bill.getPhoneNumber())
                .address(bill.getAddress())
                .totalMoney(bill.getTotalMoney())
                .reductionAmount(bill.getReductionAmount())
                .moneyShip(bill.getMoneyShip())
                .finalAmount(
                        (bill.getTotalMoney() != null ? bill.getTotalMoney() : BigDecimal.ZERO)
                                .subtract(bill.getReductionAmount() != null ? bill.getReductionAmount() : BigDecimal.ZERO)
                                .add(bill.getMoneyShip() != null ? bill.getMoneyShip() : BigDecimal.ZERO)
                )
                .createdAt(bill.getCreatedAt())
                .employeeName(bill.getEmployee() != null ? bill.getEmployee().getName() : null)
                .type(bill.getType())
                .createdBy(bill.getCreatedBy())
                .updatedBy(bill.getUpdatedBy())
                .build());
        return new PaginationResponse<>(dtoPage);
    }

    // custom function
    private BigDecimal calculateTotalMoney (BillRequestDTO request) {
        BigDecimal totalMoney = BigDecimal.ZERO;

        List<BillDetail> billDetails = billDetailRepository.findByBillId(request.getBillId());

        for (BillDetail billDetail : billDetails) {
            // Kiểm tra xem có khuyến mãi không, nếu có sử dụng giá khuyến mãi, nếu không sử dụng giá gốc
            BigDecimal price = billDetail.getPromotionalPrice() != null ? billDetail.getPromotionalPrice() : billDetail.getPrice();
            totalMoney = totalMoney.add(price.multiply(new BigDecimal(billDetail.getQuantity())));
        }
        return totalMoney;
    }
}
