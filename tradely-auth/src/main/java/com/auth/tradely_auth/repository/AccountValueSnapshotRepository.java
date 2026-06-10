package com.auth.tradely_auth.repository;

import com.auth.tradely_auth.entity.AccountValueSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AccountValueSnapshotRepository extends JpaRepository<AccountValueSnapshot, UUID> {
    List<AccountValueSnapshot> findByWalletAddressAndCapturedAtAfterOrderByCapturedAtAsc(String wallet, Instant since);
}
