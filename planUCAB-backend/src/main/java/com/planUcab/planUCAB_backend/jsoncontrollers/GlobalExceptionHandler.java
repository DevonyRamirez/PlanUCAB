package com.planUcab.planUCAB_backend.jsoncontrollers;

import com.planUcab.planUCAB_backend.model.exceptions.EventException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EventException.class)
    public ResponseEntity<Map<String, String>> handleEventException(EventException e) {
        Map<String, String> error = new HashMap<>();
        error.put("message", e.getMessage());
        error.put("error", e.getClass().getSimpleName());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        Map<String, String> response = new HashMap<>();
        response.put("message", "Validation failed");
        response.put("errors", errors.toString());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
        Map<String, String> error = new HashMap<>();
        error.put("message", e.getMessage());
        error.put("error", "IllegalArgument");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception e) {
        Map<String, String> error = new HashMap<>();
        error.put("message", e.getMessage());
        error.put("error", e.getClass().getSimpleName());
        e.printStackTrace(); // Para debugging
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}

