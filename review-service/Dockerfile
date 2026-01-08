FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY review-service/build/libs/review-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8003

ENTRYPOINT ["java","-jar","app.jar"]
