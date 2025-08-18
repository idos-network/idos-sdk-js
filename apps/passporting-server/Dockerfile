ARG NODE_VERSION=20.11
ARG TARGETPLATFORM=linux/amd64

FROM node:${NODE_VERSION}-alpine AS alpine
RUN apk update
RUN apk add --no-cache libc6-compat

# Setup `pnpm` and `turbo`
FROM alpine AS base
RUN corepack enable
RUN npm install turbo --global
RUN pnpm config set store-dir ~/.pnpm-store

# Prune projects
FROM base AS pruner

WORKDIR /workspace
COPY . .
RUN turbo prune --scope=passporting-server --docker

# Install dependencies and setup runner
FROM base AS builder

# Add needed dependencies only when building the project
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    python3-dev \
    py3-pip \
    build-base

WORKDIR /workspace

# Copy `lockfile` and `package.json`'s of isolated sub-workspace
COPY --from=pruner /workspace/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /workspace/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /workspace/out/json/ .

# Install the dependencies
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm install --no-frozen-lockfile --ignore-scripts

# Copy source code of isolated sub-workspace
COPY --from=pruner /workspace/out/full/ .

RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm prune --prod --no-optional

# Setup the runner user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono
RUN chown -R hono:nodejs /workspace

USER hono
EXPOSE 3000

CMD ["pnpm", "--filter=passporting-server", "start:node"]
