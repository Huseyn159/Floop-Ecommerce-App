package com.floop.payment.entity;

public enum TransactionType {
    CHARGE,   // Ödəniş alındı
    REFUND,   // Geri qaytarıldı
    PAYOUT    // Vendor-a ödəniş
}