package com.jangyeonguk.backend.exception;

public class UnauthorizedRoomAccessException extends RuntimeException {
    public UnauthorizedRoomAccessException(String message) {
        super(message);
    }
}

