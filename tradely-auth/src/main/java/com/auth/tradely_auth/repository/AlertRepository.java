package com.auth.tradely_auth.repository;

import com.auth.tradely_auth.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlertRepository extends JpaRepository<Alert, UUID> {
    List<Alert> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Alert> findByActiveTrueAndEmailNotifiedFalse();
}
