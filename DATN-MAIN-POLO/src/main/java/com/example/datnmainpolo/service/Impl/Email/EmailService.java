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

        public void sendPasswordResetEmail(String to, String name, String resetLink) throws MessagingException {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(fromEmail);
                helper.setTo(to);
                helper.setSubject("Đặt lại mật khẩu - POLO Viet Store");

                String html = """
                                <html>
                                <body style='font-family: Arial, sans-serif;'>
                                    <h2>Xin chào %s,</h2>
                                    <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản POLO Viet Store.</p>
                                    <p>Vui lòng nhấn vào nút dưới đây để đặt lại mật khẩu. Liên kết sẽ hết hạn sau 30 phút.</p>
                                    <p style='margin:24px 0;'>
                                        <a href='%s' style='background:#4F46E5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;'>Đặt lại mật khẩu</a>
                                    </p>
                                    <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
                                    <p>Trân trọng,<br/>POLO Viet Store</p>
                                </body>
                                </html>
                                """.formatted(name != null ? name : "bạn", resetLink);

                helper.setText(html, true);
                mailSender.send(message);
        }

    public void sendVoucherAssignmentEmail(String to, String userName, Voucher voucher) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject("Chúc mừng bạn đã nhận được phiếu giảm giá!");

        // Format dates
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
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

    public void sendOrderConfirmationEmail(String to, String userName, String billCode, 
                                         BigDecimal finalAmount, String address, String phoneNumber,
                                         String paymentMethod) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject("Xác nhận đặt hàng thành công - POLO Viet Store");

        // Format current date
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String orderDate = Instant.now().atZone(java.time.ZoneId.systemDefault()).format(formatter);

        // Format payment method
        String paymentMethodText = "COD".equals(paymentMethod) ? "Thanh toán khi nhận hàng (COD)" : 
                                  "VNPAY".equals(paymentMethod) ? "Thanh toán qua VNPay" : paymentMethod;

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
                    <h1 class="text-2xl font-bold text-green-600">Đặt hàng thành công!</h1>
                    <p class="text-gray-600">Chào %s,</p>
                    <p class="text-gray-600">Cảm ơn bạn đã đặt hàng tại POLO Viet Store!</p>
                </div>

                <!-- Order Details -->
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Thông tin đơn hàng</h2>
                    <div class="grid grid-cols-1 gap-2">
                        <p><strong class="text-gray-700">Mã đơn hàng:</strong> <span class="font-mono bg-gray-200 px-2 py-1 rounded">%s</span></p>
                        <p><strong class="text-gray-700">Ngày đặt hàng:</strong> %s</p>
                        <p><strong class="text-gray-700">Tổng tiền:</strong> <span class="text-green-600 font-semibold">%,.0f VND</span></p>
                        <p><strong class="text-gray-700">Phương thức thanh toán:</strong> %s</p>
                    </div>
                </div>

                <!-- Shipping Details -->
                <div class="bg-gray-50 rounded-lg p-6 mb-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Thông tin giao hàng</h2>
                    <div class="grid grid-cols-1 gap-2">
                        <p><strong class="text-gray-700">Người nhận:</strong> %s</p>
                        <p><strong class="text-gray-700">Số điện thoại:</strong> %s</p>
                        <p><strong class="text-gray-700">Địa chỉ:</strong> %s</p>
                    </div>
                </div>

                <!-- Status -->
                <div class="bg-blue-50 rounded-lg p-6 mb-6">
                    <h2 class="text-xl font-semibold text-blue-800 mb-4">Trạng thái đơn hàng</h2>
                    <p class="text-blue-700">
                        %s
                    </p>
                </div>

                <!-- Call to Action -->
                <div class="text-center mb-6">
                    <a href="http://localhost:3000/order-lookup?code=%s" class="inline-block bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition">
                        Tra cứu đơn hàng
                    </a>
                </div>

                <!-- Footer -->
                <div class="text-center text-gray-500 text-sm border-t pt-4">
                    <p>Cảm ơn bạn đã chọn POLO Viet Store!</p>
                    <p>Liên hệ với chúng tôi qua email: <a href="mailto:support@polostore.com" class="text-blue-600">support@polostore.com</a></p>
                    <p>© 2025 POLO Viet Store. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(
                userName,
                billCode,
                orderDate,
                finalAmount,
                paymentMethodText,
                userName,
                phoneNumber,
                address,
                "COD".equals(paymentMethod) ? 
                    "Đơn hàng của bạn đang được xác nhận. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận và giao hàng." :
                    "Đơn hàng của bạn đã được thanh toán thành công và đang được chuẩn bị. Chúng tôi sẽ giao hàng trong thời gian sớm nhất.",
                billCode
        );

        helper.setText(htmlContent, true);
        mailSender.send(message);
    }
}