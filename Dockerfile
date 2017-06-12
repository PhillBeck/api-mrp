FROM node:8.1

ADD . /

EXPOSE 9002

RUN npm install -g nodemon

RUN npm install

CMD npm run test