package com.floop.auth.repository;

import com.floop.auth.entity.TokenType;
import com.floop.auth.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {
    Optional<VerificationToken> findByTokenAndType(String token, TokenType type);
    void deleteByUserIdAndType(UUID userId, TokenType type);
}