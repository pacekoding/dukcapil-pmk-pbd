FROM golang:1.23-alpine AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api ./cmd/api

FROM alpine:3.20

RUN addgroup -S -g 10001 appgroup \
  && adduser -S -D -H -u 10001 -G appgroup appuser

WORKDIR /app

COPY --from=build /out/api /app/api
RUN mkdir -p /app/storage/uploads \
  && chown -R appuser:appgroup /app/storage

USER appuser

EXPOSE 8080

CMD ["/app/api"]
