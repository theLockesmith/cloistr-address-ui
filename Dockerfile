# Build stage
FROM node:22.23.3-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage - serve with nginx (unprivileged for OpenShift)
FROM nginxinc/nginx-unprivileged:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config as a template: the base image substitutes CLOISTR_* into it
# before nginx starts, which is how /config.js carries runtime service URLs.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Production values as defaults, so an unconfigured container is production.
# The filter keeps envsubst away from nginx's own $variables.
ENV CLOISTR_RELAY_URL=wss://relay.cloistr.xyz \
    CLOISTR_SIGNER_URL=https://signer.cloistr.xyz \
    CLOISTR_BLOSSOM_URL=https://files.cloistr.xyz \
    CLOISTR_DISCOVERY_URL=https://discover.cloistr.xyz \
    CLOISTR_APP_URL=https://me.cloistr.xyz \
    CLOISTR_ENVIRONMENT=production \
    NGINX_ENVSUBST_FILTER=^CLOISTR_

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
