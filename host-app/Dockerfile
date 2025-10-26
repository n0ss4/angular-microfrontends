FROM nginxinc/nginx-unprivileged:1.25.1-alpine-slim
ARG APP_NAME=host-app
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY dist/$APP_NAME/browser /usr/share/nginx/html
USER nginx
