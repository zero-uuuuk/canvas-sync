package com.jangyeonguk.backend.controller;

import com.jangyeonguk.backend.exception.InvalidCredentialsException;
import com.jangyeonguk.backend.exception.InvitationAlreadyAcceptedException;
import com.jangyeonguk.backend.exception.InvitationExpiredException;
import com.jangyeonguk.backend.exception.InvitationNotFoundException;
import com.jangyeonguk.backend.exception.RoomNotFoundException;
import com.jangyeonguk.backend.exception.UnauthorizedRoomAccessException;
import com.jangyeonguk.backend.exception.UserAlreadyExistsException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(RoomNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleRoomNotFoundException(RoomNotFoundException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Room not found");
        error.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleUserAlreadyExistsException(UserAlreadyExistsException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "User already exists");
        error.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }
    
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCredentialsException(InvalidCredentialsException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invalid credentials");
        error.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Bad request");
        error.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(InvitationNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleInvitationNotFoundException(InvitationNotFoundException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invitation not found");
        error.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(InvitationExpiredException.class)
    public ResponseEntity<Map<String, String>> handleInvitationExpiredException(InvitationExpiredException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invitation expired");
        error.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.GONE).body(error);
    }
    
    @ExceptionHandler(InvitationAlreadyAcceptedException.class)
    public ResponseEntity<Map<String, String>> handleInvitationAlreadyAcceptedException(InvitationAlreadyAcceptedException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invitation already accepted");
        error.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }
    
    @ExceptionHandler(UnauthorizedRoomAccessException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorizedRoomAccessException(UnauthorizedRoomAccessException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Unauthorized room access");
        error.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }
}

