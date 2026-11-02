# Middleman server. Build: docker build -t middleman .   Run: docker run -p 8080:8080 -v middleman-data:/data middleman
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY . .
RUN ./gradlew --no-daemon :server:installDist

FROM eclipse-temurin:21-jre
COPY --from=build /src/server/build/install/server /app
ENV MIDDLEMAN_DB=/data/middleman.db PORT=8080
VOLUME /data
EXPOSE 8080
ENTRYPOINT ["/app/bin/server"]
