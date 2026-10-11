# Stage 1: Build the application with Maven & OpenJDK 21
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Copy Maven descriptor and fetch dependencies (caching layer)
COPY pom.xml ./
COPY .mvn .mvn
COPY mvnw ./
# If maven wrapper fails or isn't executable, fall back to installing maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*
RUN mvn dependency:go-offline -B || true

# Copy source code and package JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal runtime image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Create a non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

# Copy built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Render passes the port in the PORT environment variable
ENV PORT=8080
EXPOSE ${PORT}

# Optimize JVM memory for container environments (Render free tier has 512MB RAM)
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
