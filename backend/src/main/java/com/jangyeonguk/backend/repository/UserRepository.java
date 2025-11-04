package com.jangyeonguk.backend.repository;

import com.jangyeonguk.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUserId(UUID userId);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}

