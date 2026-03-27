package com.floop.order.websocket;

import com.floop.order.entity.OrderStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class OrderWebSocketHandler extends TextWebSocketHandler {

    // sessionId → WebSocketSession
    // Hər user-in açıq connection-ı saxlayırıq
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    // userId → sessionId
    private final Map<String, String> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(), session);
        log.info("WebSocket connected: sessionId={}", session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session,
                                      org.springframework.web.socket.CloseStatus status) {
        sessions.remove(session.getId());
        userSessions.values().remove(session.getId());
        log.info("WebSocket disconnected: sessionId={}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session,
                                     TextMessage message) {
        // Client userId göndərir — session ilə əlaqələndiririk
        String userId = message.getPayload();
        userSessions.put(userId, session.getId());
        log.info("User registered: userId={}, sessionId={}", userId, session.getId());
    }

    // Sifariş statusu dəyişdikdə client-ə göndər
    public void sendOrderUpdate(UUID orderId, OrderStatus status) {
        String message = String.format(
                "{\"orderId\":\"%s\",\"status\":\"%s\"}",
                orderId, status);

        sessions.values().forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(message));
                }
            } catch (Exception e) {
                log.error("WebSocket send error: {}", e.getMessage());
            }
        });
    }
}