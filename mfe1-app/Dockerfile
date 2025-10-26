FROM nginxinc/nginx-unprivileged:1.25.1-alpine-slim
ARG APP_NAME=mfe1-app
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY dist/$APP_NAME /usr/share/nginx/html
USER nginx
