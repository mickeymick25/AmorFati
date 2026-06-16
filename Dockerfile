FROM node:22-alpine

WORKDIR /app

# Installer les dépendances système minimales
RUN apk add --no-cache git

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances Node.js
RUN npm install

# Copier le code source
COPY . .

# Exposer le port de dev Vite
EXPOSE 5173

# Port pour les tests Vitest UI (optionnel)
EXPOSE 51204

# Par défaut, lancer le serveur de dev
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
