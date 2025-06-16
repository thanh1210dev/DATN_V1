package com.example.datnmainpolo.service.Impl.Email;



import com.example.datnmainpolo.entity.Voucher;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVoucherAssignmentEmail(String to, String userName, Voucher voucher) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject("Chúc mừng bạn đã nhận được phiếu giảm giá!");

        // Format dates
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String startTime = voucher.getStartTime() != null ? voucher.getStartTime().atZone(java.time.ZoneId.systemDefault()).format(formatter) : "N/A";
        String endTime = voucher.getEndTime() != null ? voucher.getEndTime().atZone(java.time.ZoneId.systemDefault()).format(formatter) : "N/A";

        // Determine discount value
        String discountValue = voucher.getPercentageDiscountValue() != null
                ? String.format("%.0f%%", voucher.getPercentageDiscountValue())
                : String.format("%,.0f VND", voucher.getFixedDiscountValue());

        // Format minimum order value safely
        String minOrderValueFormatted = voucher.getMinOrderValue() != null
                ? String.format("%,.0f VND", voucher.getMinOrderValue())
                : "0 VND";

        String htmlContent = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-100 font-sans">
            <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 my-8">
                <!-- Header -->
                <div class="text-center mb-6">
                    <h1 class="text-2xl font-bold text-blue-600">Chúc mừng bạn đã nhận được phiếu giảm giá!</h1>
                    <p class="text-gray-600">Chào %s,</p>
                </div>

                <!-- Voucher Details -->
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Thông tin phiếu giảm giá từ POLO Viet Store</h2>
                    <div class="grid grid-cols-1 gap-2">
                        <p><strong class="text-gray-700">Mã phiếu giảm giá:</strong> <span class="font-mono bg-gray-200 px-2 py-1 rounded">%s</span></p>
                        <p><strong class="text-gray-700">Giá trị giảm giá:</strong> %s</p>
                        <p><strong class="text-gray-700">Ngày hết hạn:</strong> %s</p>
                        <p><strong class="text-gray-700">Đơn giá tối thiểu:</strong> %s</p>
                       
                    </div>
                </div>

                <!-- Call to Action -->
                <div class="text-center mb-6">
                    <a href="https://your-website.com" class="inline-block bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition">
                        Hãy sử dụng mã ngay để được ưu đãi trên trang web của chúng tôi!
                    </a>
                </div>

                <!-- Footer -->
                <div class="text-center text-gray-500 text-sm border-t pt-4">
                    <p>Cảm ơn bạn đã chọn Berry Store!</p>
                    <p>Liên hệ với chúng tôi qua email: <a href="mailto:support@berrystore.com" class="text-blue-600">support@berrystore.com</a></p>
                    <p>© 2025 Berry Store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(
                userName,
                voucher.getCode(),
                discountValue,
                endTime,
                minOrderValueFormatted,
                "100000" + " VND", // Example values from image
                "50000" + " VND"  // Example values from image
        );

        helper.setText(htmlContent, true);
        mailSender.send(message);
    }
}