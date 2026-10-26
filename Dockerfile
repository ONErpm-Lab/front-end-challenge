# syntax=docker/dockerfile:1

# Two stages: build the Angular app (browser + SSR server) with the full toolchain, then ship only the build
# output. The SSR server bundle carries its own dependencies, so the app in the final image has no node_modules
# and no source: just Node and the compiled app, running as an unprivileged user. (The base image tag is
# written out, not built from an ARG, so Dependabot can keep it up to date.)
FROM node:24-alpine AS build
WORKDIR /app

# The npm bundled with early Node 24 fails to resolve this lockfile; use the version pinned in package.json.
COPY package.json package-lock.json ./
RUN npm install -g "npm@$(node -p "require('./package.json').packageManager.split('@')[1]")" \
  && HUSKY=0 npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    PORT=4000
WORKDIR /app

COPY --from=build --chown=node:node /app/dist/onerpm-tracks ./
USER node
EXPOSE 4000

# /api/health answers 200 once the server is up, whatever Spotify is doing and with no credentials.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

# SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET and NG_ALLOWED_HOSTS come from the environment of the deployment.
CMD ["node", "server/server.mjs"]
