FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_RECAPTCHA_ENTERPRISE_SITE_KEY
ARG VITE_GOOGLE_MAPS_API_KEY

RUN test -n "$VITE_FIREBASE_API_KEY" \
  && test -n "$VITE_FIREBASE_AUTH_DOMAIN" \
  && test -n "$VITE_FIREBASE_PROJECT_ID" \
  && test -n "$VITE_FIREBASE_APP_ID" \
  && npm run build

FROM nginx:stable-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
