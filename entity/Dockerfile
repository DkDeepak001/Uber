# Runtime stage - assumes entity is pre-built using build-entity.sh
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy pre-built JAR from build directory (assumes build-entity.sh was run)
COPY build/libs/entity-*-SNAPSHOT.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
