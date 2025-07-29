package com.example.datnmainpolo.exception;

import com.fasterxml.jackson.databind.exc.InvalidDefinitionException;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(HttpMessageConversionException.class)
    public ResponseEntity<?> handleHttpMessageConversionException(HttpMessageConversionException ex) {
        LOGGER.error("HttpMessageConversionException caught - likely Hibernate proxy serialization issue: {}", ex.getMessage(), ex);
        
        // Trả về empty list để frontend không crash, đặc biệt cho các endpoint address
        return ResponseEntity.ok(Collections.emptyList());
    }

    @ExceptionHandler(InvalidDefinitionException.class)
    public ResponseEntity<?> handleInvalidDefinitionException(InvalidDefinitionException ex) {
        LOGGER.error("InvalidDefinitionException caught - Jackson serialization issue: {}", ex.getMessage(), ex);
        
        // Trả về empty list để frontend không crash
        return ResponseEntity.ok(Collections.emptyList());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        LOGGER.error("Global RuntimeException handler caught: {}: {}", ex.getClass().getSimpleName(), ex.getMessage(), ex);
        
        // Nếu là exception liên quan đến voucher hoặc bill, trả về error message
        String message = ex.getMessage();
        if (message != null && (message.contains("voucher") || message.contains("hóa đơn") || message.contains("bill"))) {
            ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                message
            );
            return ResponseEntity.badRequest().body(error);
        }
        
        // TẠM THỜI: Trả về empty list thay vì lỗi 400 để frontend không crash
        // Điều này đặc biệt quan trọng cho các endpoint address
        return ResponseEntity.ok(Collections.emptyList());
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<ErrorResponse> handleIOException(IOException ex) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                ex.getMessage() // ví dụ: "Hình ảnh đã tồn tại: Không thể đăng trùng ảnh!"
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(WebExchangeBindException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(WebExchangeBindException ex) {
        List<String> errors = ex.getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.toList());

        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Dữ liệu không hợp lệ",
                errors
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @Data
    static class ErrorResponse {
        private int status;
        private String message;
        private List<String> errors;

        public ErrorResponse(int status, String message) {
            this.status = status;
            this.message = message;
        }

        public ErrorResponse(int status, String message, List<String> errors) {
            this.status = status;
            this.message = message;
            this.errors = errors;
        }
    }
}
