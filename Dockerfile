FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all backend source code
COPY . .

# Expose the correct port
EXPOSE 5001

# Start the application
CMD ["node", "server.js"]
