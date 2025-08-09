package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.repository.BillRepository;
import com.example.datnmainpolo.service.BillService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"}, allowCredentials = "true")
@RequiredArgsConstructor
public class OrderLookupController {
    private static final Logger LOGGER = LoggerFactory.getLogger(OrderLookupController.class);

    private final BillRepository billRepository;
    private final BillService billService;

    @GetMapping("/lookup")
    public ResponseEntity<BillResponseDTO> lookup(@RequestParam String code, @RequestParam String phone) {
        LOGGER.info("🔎 Lookup order by code={} and phone=***", code);
        Optional<Bill> billOpt = billRepository.findByCodeAndPhoneNumberAndDeletedFalse(code, phone);
        if (billOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(billService.convertToBillResponseDTO2(billOpt.get()));
    }

    @PostMapping("/cancel")
    public ResponseEntity<BillResponseDTO> cancel(@RequestParam String code, @RequestParam String phone) {
        LOGGER.info("❌ Guest cancel request for code={} and phone=***", code);
        Optional<Bill> billOpt = billRepository.findByCodeAndPhoneNumberAndDeletedFalse(code, phone);
        if (billOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Bill bill = billOpt.get();
        // Allow cancel in early stages only
        if (!(bill.getStatus() == com.example.datnmainpolo.enums.OrderStatus.CONFIRMING
                || bill.getStatus() == com.example.datnmainpolo.enums.OrderStatus.PENDING)) {
            return ResponseEntity.badRequest().build();
        }
        try {
            billService.updateBillStatus(bill.getId(), com.example.datnmainpolo.enums.OrderStatus.CANCELLED);
            Bill refreshed = billRepository.findById(bill.getId()).orElse(bill);
            return ResponseEntity.ok(billService.convertToBillResponseDTO2(refreshed));
        } catch (Exception e) {
            LOGGER.error("Cancel failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
