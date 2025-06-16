package com.example.datnmainpolo.Scheduler;

import com.example.datnmainpolo.entity.ProductDetail;
import com.example.datnmainpolo.entity.Promotion;
import com.example.datnmainpolo.entity.PromotionProductDetail;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.repository.ProductDetailRepository;
import com.example.datnmainpolo.repository.PromotionProductDetailRepository;
import com.example.datnmainpolo.repository.PromotionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import java.util.List;

@Component
public class PromotionExpiryScheduler {

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private PromotionProductDetailRepository promotionProductDetailRepository;

    @Autowired
    private ProductDetailRepository productDetailRepository;

    @Scheduled(cron = "0 0 * * * *") // Chạy mỗi giờ
    @Transactional
    public void handleExpiredPromotions() {
        Instant now = Instant.now();
        List<Promotion> expiredPromotions = promotionRepository.findByEndTimeBeforeAndStatus(now, PromotionStatus.ACTIVE);

        for (Promotion promotion : expiredPromotions) {
            // Cập nhật trạng thái khuyến mãi sang EXPIRED
            promotion.setStatus(PromotionStatus.EXPIRED);
            promotion.setUpdatedAt(now);
            promotionRepository.save(promotion);

            // Lấy tất cả PromotionProductDetail liên quan
            List<PromotionProductDetail> promotionDetails = promotionProductDetailRepository.findByPromotionId(promotion.getId());
            for (PromotionProductDetail detail : promotionDetails) {
                // Đánh dấu PromotionProductDetail là deleted
                detail.setDeleted(true);
                detail.setUpdatedAt(now);

                // Cập nhật ProductDetail về giá gốc
                ProductDetail productDetail = detail.getDetailProduct();
                productDetail.setPromotionalPrice(productDetail.getPrice());
                productDetail.setUpdatedAt(now);
                productDetailRepository.save(productDetail);
            }

            promotionProductDetailRepository.saveAll(promotionDetails);
        }
    }
}
