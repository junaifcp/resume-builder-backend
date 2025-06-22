# Dockerfile

# --- Stage 1: Builder ---
# This stage installs all dependencies (including dev) and builds the TypeScript code.
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies, including devDependencies needed for building
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Run the build script from your package.json (tsc)
# This will compile your TypeScript into JavaScript in a /dist folder
RUN npm run build


# --- Stage 2: Production ---
# This stage creates the final, lean image for running the application.
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json again
COPY package*.json ./

# Install ONLY production dependencies. --omit=dev is crucial.
RUN npm install --omit=dev

# Copy the compiled code from the 'builder' stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy the uploads directory if you want to include existing uploads in the image
# NOTE: This does not make uploads persistent. See Step 5 for handling persistent storage.
COPY uploads ./uploads

# Your application listens on a port defined by the PORT environment variable.
# We expose it here. Defaulting to 5001 if not set.
EXPOSE 5001

# The command to start your application, based on your package.json "start" script.
CMD [ "node", "dist/app.js" ]