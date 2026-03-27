FROM eclipse-temurin:17-jre
WORKDIR /app
COPY build/libs/api-gateway-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]