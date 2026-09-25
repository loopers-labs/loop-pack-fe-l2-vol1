FROM node:24.17.0-alpine

ARG SOURCE_REVISION=unknown
ARG SOURCE_URL=local

ENV NODE_ENV=production \
    PORT=4000

LABEL org.opencontainers.image.title="loopers-dlc-commerce-api" \
      org.opencontainers.image.revision="${SOURCE_REVISION}" \
      org.opencontainers.image.source="${SOURCE_URL}"

WORKDIR /app

COPY --chown=node:node package.json app.mjs server.mjs ./

USER node

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:4000/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "server.mjs"]
