FROM eclipse-temurin:21-jdk-alpine

RUN apk add --no-cache docker-cli

WORKDIR /app

COPY target/execution-service-*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
