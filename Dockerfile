FROM node:18-alpine3.18

WORKDIR /app

# ====================
# INSTALL VARIOUS OS DEPENDENCIES 
# ====================
RUN apk --no-cache add --virtual build-base python3 \
    g++ cairo-dev make bash \
    jpeg-dev pango-dev giflib-dev \
    libxi-dev mesa-dev glew-dev \
    pkgconfig

# ====================
# BUILD GO-SLANG 
# ====================
    
COPY go-slang ./go-slang

WORKDIR /app/go-slang

RUN yarn install 

RUN yarn build

RUN yarn link

# ====================
# BUILD JS-SLANG
# ====================
WORKDIR /app

COPY js-slang ./js-slang

WORKDIR /app/js-slang

RUN yarn link "go-slang"

RUN yarn install

RUN yarn build

RUN yarn link

# ====================
# BUILD FRONTEND
# ====================
WORKDIR /app

COPY frontend ./frontend

RUN yarn link "js-slang"

RUN yarn install

# ====================
# START FRONTEND 
# ====================

WORKDIR /app/frontend

EXPOSE 8000

CMD ["yarn", "run", "start"]
