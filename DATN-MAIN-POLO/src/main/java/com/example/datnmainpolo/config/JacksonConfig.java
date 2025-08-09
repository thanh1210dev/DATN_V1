package com.example.datnmainpolo.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Thêm module để xử lý Java Time (từ AppConfig)
        mapper.registerModule(new JavaTimeModule());
        
    // Ghi ngày tháng dạng chuỗi theo timezone VN thay vì epoch timestamp
    mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    // Tắt lỗi khi serialize empty beans
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        
        // Tắt lỗi khi gặp unknown properties
        mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
    // Đặt timezone mặc định cho mapper (cũng đã cấu hình trong application.yml)
    mapper.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        
        return mapper;
    }
}
