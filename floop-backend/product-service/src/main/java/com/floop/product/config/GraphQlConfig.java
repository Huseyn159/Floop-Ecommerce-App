package com.floop.product.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import reactor.core.publisher.Mono;

@Configuration
public class GraphQlConfig {

    @Bean
    public WebGraphQlInterceptor headerInterceptor() {
        return new WebGraphQlInterceptor() {
            @Override
            public Mono<WebGraphQlResponse> intercept(
                    WebGraphQlRequest request, Chain chain) {

                // HTTP header-dən X-User-Id oxu
                String userId = request.getHeaders()
                        .getFirst("X-User-Id");

                // GraphQL context-ə əlavə et
                if (userId != null) {
                    request.configureExecutionInput((input, builder) ->
                            builder.graphQLContext(ctx ->
                                    ctx.put("userId", userId)).build());
                }

                return chain.next(request);
            }
        };
    }
}