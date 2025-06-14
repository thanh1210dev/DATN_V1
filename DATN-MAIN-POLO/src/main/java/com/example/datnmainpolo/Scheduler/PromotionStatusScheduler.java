package com.example.datnmainpolo.Scheduler;


import com.example.datnmainpolo.service.PromotionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PromotionStatusScheduler {

    @Autowired
    private PromotionService promotionService;

    @Scheduled(cron = "0 0 * * * *")
    public void updatePromotionStatuses() {
        promotionService.updateActivePromotions();
        promotionService.updateExpiredPromotions();
    }
}