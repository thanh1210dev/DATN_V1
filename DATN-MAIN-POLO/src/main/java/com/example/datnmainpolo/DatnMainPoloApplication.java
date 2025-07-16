package com.example.datnmainpolo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.SpringApplication;

import org.springframework.scheduling.annotation.EnableScheduling;


@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties
public class DatnMainPoloApplication {
    public static void main(String[] args) {
        SpringApplication.run(DatnMainPoloApplication.class, args);
    }
}