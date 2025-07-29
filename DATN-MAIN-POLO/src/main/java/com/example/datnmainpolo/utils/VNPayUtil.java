package com.example.datnmainpolo.utils;

import jakarta.servlet.http.HttpServletRequest;

import jakarta.servlet.http.HttpServletRequest;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

public class VNPayUtil {

    public static String removeDiacritics(String str) {
        if (str == null) {
            return null;
        }
        String nfdNormalizedString = Normalizer.normalize(str, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(nfdNormalizedString).replaceAll("")
                .replaceAll("đ", "d").replaceAll("Đ", "D");
    }

    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException();
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes();
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();

        } catch (Exception ex) {
            ex.printStackTrace();
            return "";
        }
    }

    public static String getIpAddress(HttpServletRequest request) {
        String ipAddress;
        try {
            ipAddress = request.getHeader("X-FORWARDED-FOR");
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getHeader("X-Real-IP");
            }
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getRemoteAddr();
            }
            
            // Convert IPv6 localhost to IPv4
            if ("0:0:0:0:0:0:0:1".equals(ipAddress) || "::1".equals(ipAddress)) {
                ipAddress = "127.0.0.1";
            }
            
            // Ensure IPv4 format for VNPay
            if (ipAddress != null && ipAddress.contains(":") && !ipAddress.equals("127.0.0.1")) {
                // If it's still IPv6, use default IPv4
                ipAddress = "127.0.0.1";
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            ipAddress = "127.0.0.1"; // Default fallback
        }
        return ipAddress;
    }

    public static String createPaymentUrl(String baseUrl, String secretKey, Map<String, String> paramsMap) {
        // Log input parameters for debugging
        System.out.println("VNPayUtil.createPaymentUrl - baseUrl: " + baseUrl);
        System.out.println("VNPayUtil.createPaymentUrl - params: " + paramsMap);
        
        // Sắp xếp parameters theo alphabet - QUAN TRỌNG với VNPay
        List<String> fieldNames = new ArrayList<>(paramsMap.keySet());
        Collections.sort(fieldNames);
        
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        
        // Log sorted field names
        System.out.println("VNPayUtil.createPaymentUrl - sorted fields: " + fieldNames);
        
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = paramsMap.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                try {
                    // Build hash data - ENCODE fieldValue (theo code mẫu GitHub)
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                    // Build query - encode cả fieldName và fieldValue
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                } catch (Exception e) {
                    e.printStackTrace();
                }
                
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        
        // Log hash data trước khi tạo chữ ký - QUAN TRỌNG để debug
        String rawHashData = hashData.toString();
        System.out.println("VNPayUtil.createPaymentUrl - rawHashData: " + rawHashData);
        
        // Tạo signature
        String vnp_SecureHash = hmacSHA512(secretKey, rawHashData);
        System.out.println("VNPayUtil.createPaymentUrl - vnp_SecureHash: " + vnp_SecureHash);
        
        // Build final URL
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);
        
        String finalUrl = baseUrl + "?" + query.toString();
        System.out.println("VNPayUtil.createPaymentUrl - finalUrl: " + finalUrl);
        
        return finalUrl;
    }
}
