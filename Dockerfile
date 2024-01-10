# Stage 0 - base node customizations
FROM node:20.10.0-alpine3.19 as base-node

RUN npm install -g npm@10.2.5

# Stage 1 - api build - requires development environment because typescript
FROM base-node as api-build-stage

ENV NODE_ENV=development

WORKDIR /usr/src/api

COPY api/package*.json ./
COPY api/tsconfig*.json ./
RUN npm install

COPY api ./

RUN npm run build

# Stage 2 - web build - requires development environment to install vue-cli-service
FROM base-node as web-build-stage

ENV NODE_ENV=development

WORKDIR /usr/src/web

COPY web/package*.json ./
COPY web/tsconfig*.json ./
COPY web/babel.config.js ./
RUN npm install

COPY web ./

# Switching to production mode for build environment.
ENV NODE_ENV=production
RUN npm run build

# Stage 3 - production setup
FROM base-node

ARG RELEASE_TAG
ARG GIT_COMMIT_HASH

ENV RELEASE_TAG=${RELEASE_TAG}
ENV GIT_COMMIT_HASH=${GIT_COMMIT_HASH}

ENV NODE_ENV=production
USER node

WORKDIR /home/node/app
RUN chown -R node:node /home/node/app

COPY --from=api-build-stage --chown=node:node /usr/src/api/package*.json ./
RUN npm install && npm cache clean --force --loglevel=error

COPY --from=api-build-stage --chown=node:node /usr/src/api/dist/src ./dist
COPY --from=web-build-stage --chown=node:node /usr/src/web/dist ./dist/web

RUN echo "RELEASE_TAG=${RELEASE_TAG}" >> VERSION
RUN echo "GIT_COMMIT_HASH=${GIT_COMMIT_HASH}" >> VERSION

EXPOSE 3000

COPY --from=api-build-stage --chown=node:node /usr/src/api/bin/boot-app.sh ./bin/
RUN chmod +x ./bin/boot-app.sh

ENTRYPOINT ["./bin/boot-app.sh"]
