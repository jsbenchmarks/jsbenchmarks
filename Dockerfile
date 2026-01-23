# Build stage
FROM golang:1.25 AS builder

WORKDIR /app

# Copy go mod and sum files
COPY server/go.mod ./

# Download dependencies
RUN go mod download

# Copy source code
COPY server .

# Build the application
RUN go build main.go

# Run stage
FROM debian:bookworm-slim

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/main .

# Expose the port (informative)
EXPOSE 10001

# Run the binary
CMD ["./main"]
