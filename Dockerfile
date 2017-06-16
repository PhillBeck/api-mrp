FROM node:8.1

ADD . /

EXPOSE 9002

RUN npm install

CMD node server/server.js