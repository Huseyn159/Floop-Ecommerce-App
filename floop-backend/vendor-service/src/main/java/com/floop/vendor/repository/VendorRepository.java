package com.floop.vendor.repository;


import com.floop.vendor.entity.Vendor;
import com.floop.vendor.entity.VendorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Repository
public interface VendorRepository extends JpaRepository<Vendor, UUID> {
    boolean existsByStoreSlug(String storeSlug);
    boolean existsByBusinessEmail(String businessEmail);
    Optional<Vendor> findByStoreSlug(String storeSlug);
    List<Vendor> findByStatus(VendorStatus status);
}