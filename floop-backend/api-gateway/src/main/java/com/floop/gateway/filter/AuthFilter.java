package com.floop.gateway.filter;

import com.floop.gateway.security.GatewayJwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
public class AuthFilter extends
        AbstractGatewayFilterFactory<AuthFilter.Config> {

    private final GatewayJwtUtil jwtUtil;
    private final ReactiveStringRedisTemplate redisTemplate;

    private static final int RATE_LIMIT = 100;
    private static final int RATE_LIMIT_WINDOW = 60;

    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/verify-email",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/refresh-token",
            "/api/auth/oauth2/google",
            "/v3/api-docs",
            "/graphql",
            "/swagger-ui",
            "/swagger-ui.html",
            "/auth-service/v3/api-docs",
            "/user-service/v3/api-docs",
            "/vendor-service/v3/api-docs",
            "/order-service/v3/api-docs",
            "/payment-service/v3/api-docs"
    );

    public AuthFilter(GatewayJwtUtil jwtUtil, ReactiveStringRedisTemplate redisTemplate) {
        super(Config.class);
        this.jwtUtil = jwtUtil;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String path = exchange.getRequest().getPath().value();
            String ip = getClientIp(exchange);

            return checkRateLimit(ip)
                    .flatMap(limited -> {
                        if (limited) {
                            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                            return exchange.getResponse().setComplete();
                        }

                        String authHeader = exchange.getRequest()
                                .getHeaders()
                                .getFirst(HttpHeaders.AUTHORIZATION);

                        // Token varsa həmişə yoxla və header inject et
                        if (authHeader != null && authHeader.startsWith("Bearer ")) {
                            String token = authHeader.substring(7);
                            if (jwtUtil.isTokenValid(token)) {
                                String userId = jwtUtil.extractUserId(token);
                                String role = jwtUtil.extractRole(token);
                                ServerWebExchange modifiedExchange = exchange.mutate()
                                        .request(exchange.getRequest().mutate()
                                                .header("X-User-Id", userId)
                                                .header("X-User-Role", role)
                                                .build())
                                        .build();
                                return chain.filter(modifiedExchange);
                            }
                        }

                        // Token yoxdursa — public path-dirsə keç, yoxsa 401
                        if (isPublicPath(path)) {
                            return chain.filter(exchange);
                        }

                        return unauthorized(exchange);
                    });
        };
    }



    // Rate limit yoxlama
    private Mono<Boolean> checkRateLimit(String ip) {
        String key = "rate_limit:" + ip;
        return redisTemplate.opsForValue()
                .increment(key)
                .flatMap(count -> {
                    if (count == 1) {
                        return redisTemplate
                                .expire(key, Duration.ofSeconds(RATE_LIMIT_WINDOW))
                                .thenReturn(count > RATE_LIMIT);
                    }
                    return Mono.just(count > RATE_LIMIT);
                });
    }

    private String getClientIp(ServerWebExchange exchange) {
        String xForwardedFor = exchange.getRequest()
                .getHeaders()
                .getFirst("X-Forwarded-For");
        if (xForwardedFor != null) {
            return xForwardedFor.split(",")[0].trim();
        }
        return exchange.getRequest()
                .getRemoteAddress()
                .getAddress()
                .getHostAddress();
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    public static class Config {
    }
}