# Middleman server. Build: docker build -t middleman .   Run: docker run -p 8080:8080 -v middleman-data:/data middleman
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY . .
RUN ./gradlew --no-daemon :server:installDist

FROM eclipse-temurin:21-jre
COPY --from=build /src/server/build/install/server /app
# Public fingerprint of the release signing certificate; override with ANDROID_CERT_SHA256.
ENV MIDDLEMAN_DB=/data/middleman.db PORT=8080 \
    ANDROID_CERT_SHA256=7A:E1:5B:26:6B:58:C5:1B:4B:17:65:A5:73:E4:DD:60:9D:5A:14:90:8B:B9:EB:66:2E:8F:C6:79:73:17:B1
VOLUME /data
EXPOSE 8080
ENTRYPOINT ["/app/bin/server"]
