package com.floop.user.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    private UUID userId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private String phoneNumber;
    private String avatarUrl;
    private String bio;

    // Bildiriş tənzimləmələri
    private boolean emailNotifications;
    private boolean pushNotifications;

    // Dil və valyuta
    private String language;
    private String currency;

    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL)
    private List<UserAddress> addresses;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        emailNotifications = true;
        pushNotifications = true;
        language = "az";
        currency = "AZN";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}