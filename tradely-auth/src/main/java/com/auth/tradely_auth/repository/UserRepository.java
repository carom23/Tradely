package com.auth.tradely_auth.repository;

import com.auth.tradely_auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPasswordResetToken(String passwordResetToken);
    Optional<User> findByEmailVerificationToken(String emailVerificationToken);
    java.util.List<User> findByHlWalletAddressIsNotNull();
}
