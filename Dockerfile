FROM node:8.1-alpine

ADD package.json /app/package.json

ADD yarn.lock /app/yarn.lock

RUN apk update && apk add yarn

RUN cd app && yarn

ADD server /app/server

EXPOSE 9000

CMD cd /app && node server/server.js
