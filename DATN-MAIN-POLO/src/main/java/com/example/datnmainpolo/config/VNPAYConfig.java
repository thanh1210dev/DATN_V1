package com.example.datnmainpolo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "vnpay")
public class VNPAYConfig {

    private String tmnCode;
    private String hashSecret;
    private String payUrl;
    private String returnUrl;
    private String apiVersion;
    private String command;
    private String orderType;
    private String currCode;
    private String locale;
    private String paymentBackReturnUrl;

    // public Map<String, String> getVNPayConfigMap() {
    //     Map<String, String> vnpParamsMap = new HashMap<>();
    //     vnpParamsMap.put("vnp_Version", this.vnp_Version);
    //     vnpParamsMap.put("vnp_Command", this.vnp_Command);
    //     vnpParamsMap.put("vnp_TmnCode", this.vnp_TmnCode);
    //     vnpParamsMap.put("vnp_CurrCode", this.vnp_CurrCode);
    //     vnpParamsMap.put("vnp_Locale", this.vnp_Locale);
    //     return vnpParamsMap;
    // }
}
