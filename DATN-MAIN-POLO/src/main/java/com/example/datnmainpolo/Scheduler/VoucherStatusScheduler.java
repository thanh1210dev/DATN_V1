package com.example.datnmainpolo.Scheduler;

import com.example.datnmainpolo.service.VoucherService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class VoucherStatusScheduler {

    private static final Logger logger = LoggerFactory.getLogger(VoucherStatusScheduler.class);

    @Autowired
    private VoucherService voucherService;

    @Scheduled(cron = "0 */5 * * * *") // Run every 5 minutes for better responsiveness
    public void updateVoucherStatuses() {
        try {
            logger.info("Starting voucher status update...");
            voucherService.updateActiveVouchers();
            voucherService.updateExpiredVouchers();
            logger.info("Voucher status update completed");
        } catch (Exception e) {
            logger.error("Error updating voucher statuses", e);
        }
    }

    // Manual trigger method for immediate update
    public void triggerImmediateUpdate() {
        logger.info("Manual voucher status update triggered");
        updateVoucherStatuses();
    }
}
