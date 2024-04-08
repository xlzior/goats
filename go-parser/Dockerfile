FROM golang:1.20-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o go-parser .

EXPOSE 8080

CMD ["./go-parser"]
