FROM alpine:3.22 AS alpine

FROM n8nio/n8n:latest

USER root

# Restoring apk for distroless hardened latest n8n images
COPY --from=alpine /sbin/apk /sbin/apk
COPY --from=alpine /usr/lib/libapk.so* /usr/lib/
COPY --from=alpine /etc/apk/repositories /etc/apk/repositories

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

# Install the required puppeteer libraries directly into n8n's module folder so the isolated Task Runner can find them natively.
USER root
RUN cd /usr/local/lib/node_modules/n8n && npm install puppeteer-extra puppeteer-extra-plugin-stealth

# Allow the n8n user to read/write in .n8n
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n

USER node
