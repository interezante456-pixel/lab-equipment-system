# Etapa 1: Compilación de la aplicación React con Vite
FROM node:20.19.0-alpine3.21 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Etapa 2: Servidor Web Nginx de Producción
FROM nginx:1.27.4-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/run

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
USER nginx

