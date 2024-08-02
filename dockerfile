# Use an official Node.js runtime as a parent image
FROM node:20.10.0

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application's source code to the working directory
COPY . .

# Make sure the app binds to port 8080, which is the default port for Google Cloud Run
EXPOSE 8080

# Start the application
CMD ["node", "index.js"]
