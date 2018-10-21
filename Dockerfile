FROM node:10-alpine

WORKDIR /app
COPY package.json yarn.lock ./

RUN yarn install --production && \
    yarn cache clean && \
    rm -rf /var/cache/* /tmp/* /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn && \
    adduser -S nodejs && \
    chown -R nodejs /app && \
    chown -R nodejs /home/nodejs

COPY index.js ./index.js
COPY test ./test
COPY bin ./bin

USER nodejs

CMD ["node", "test/integration"]
