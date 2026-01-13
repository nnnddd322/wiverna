FROM node:18-alpine

# Install LibreOffice and poppler-utils for PDF conversion
RUN apk add --no-cache \
    libreoffice \
    poppler-utils \
    ttf-dejavu \
    fontconfig

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Expose port
EXPOSE 8787

# Start the server
CMD ["node", "index.js"]
