FROM n8nio/n8n:latest

USER root

# Install Puppeteer dependencies for Alpine Linux
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Allow the n8n user to read/write in .n8n
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n

USER node
