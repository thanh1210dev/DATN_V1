package com.example.datnmainpolo.exception;

import com.fasterxml.jackson.databind.exc.InvalidDefinitionException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ========== VALIDATION (Bean Validation + @Valid) ==========
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<?> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "VALIDATION_ERROR");
        body.put("messages", ex.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage()).collect(Collectors.toList()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "VALIDATION_ERROR");
        body.put("messages", ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage()).collect(Collectors.toList()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // ========== CUSTOM BUSINESS (IllegalArgument...) ==========
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "BAD_REQUEST", "message", ex.getMessage()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<?> handleEntityNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "NOT_FOUND", "message", ex.getMessage()));
    }

    // ========== JACKSON / SERIALIZATION ==========
    @ExceptionHandler(HttpMessageConversionException.class)
    public ResponseEntity<?> handleHttpMessageConversionException(HttpMessageConversionException ex) {
        LOGGER.error("HttpMessageConversionException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "BAD_REQUEST", "message", "Dữ liệu gửi lên không hợp lệ"));
    }

    @ExceptionHandler(InvalidDefinitionException.class)
    public ResponseEntity<?> handleInvalidDefinitionException(InvalidDefinitionException ex) {
        LOGGER.error("InvalidDefinitionException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "BAD_REQUEST", "message", "Không ánh xạ được dữ liệu"));
    }

    // ========== RUNTIME ==========
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        LOGGER.error("RuntimeException: {}: {}", ex.getClass().getSimpleName(), ex.getMessage(), ex);
        String msg = ex.getMessage() != null ? ex.getMessage() : "Lỗi hệ thống";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "RUNTIME", "message", msg));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatusException(ResponseStatusException ex) {
        LOGGER.error("ResponseStatusException {}: {}", ex.getStatusCode(), ex.getReason());
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("error", ex.getStatusCode().toString(), "message", ex.getReason()));
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<?> handleIOException(IOException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "IO_CONFLICT", "message", ex.getMessage()));
    }

    @ExceptionHandler(WebExchangeBindException.class)
    public ResponseEntity<?> handleWebExchangeBind(WebExchangeBindException ex) {
        List<String> errors = ex.getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "BIND_ERROR", "messages", errors));
    }

    // ========== FALLBACK ==========
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneric(Exception ex) {
        LOGGER.error("Unhandled Exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "INTERNAL_ERROR", "message", ex.getMessage()));
    }

    @Data
    static class ErrorResponse {
        private final int status;
        private final String message;
        private final List<String> errors;
    }
}
