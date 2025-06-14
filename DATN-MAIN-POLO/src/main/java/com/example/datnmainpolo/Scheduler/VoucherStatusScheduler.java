package com.example.datnmainpolo.Scheduler;

import com.example.datnmainpolo.service.VoucherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class VoucherStatusScheduler {

    @Autowired
    private VoucherService voucherService;

    @Scheduled(cron = "0 0 * * * *") // Run every hour
    public void updateVoucherStatuses() {
        voucherService.updateActiveVouchers();
        voucherService.updateExpiredVouchers();
    }
}
