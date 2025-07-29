package com.example.datnmainpolo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

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

    public Map<String, String> getVNPayConfigMap() {
        Map<String, String> vnpParamsMap = new HashMap<>();
        vnpParamsMap.put("vnp_Version", this.apiVersion);
        vnpParamsMap.put("vnp_Command", this.command);
        vnpParamsMap.put("vnp_TmnCode", this.tmnCode);
        vnpParamsMap.put("vnp_CurrCode", this.currCode);
        vnpParamsMap.put("vnp_Locale", this.locale);
        return vnpParamsMap;
    }

}
