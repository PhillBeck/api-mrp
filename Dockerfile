FROM node:8.1-alpine

ADD package.json /app/package.json

RUN cd app && npm i

ADD server /app/server

EXPOSE 9000

CMD cd /app && node server/server.js
