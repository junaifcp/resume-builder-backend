# Dockerfile

# --- Stage 1: Builder ---
# Use Node 20 on Debian for compatibility with pdfjs-dist@5.x and native builds
FROM node:20-bullseye AS builder

# Install Python3, build tools, and native libs for canvas
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      python3-dev \
      build-essential \
      libcairo2-dev \
      libpango1.0-dev \
      libjpeg-dev \
      libgif-dev \
      librsvg2-dev && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies, including devDependencies needed for building
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Run the build script (e.g., tsc)
RUN npm run build


# --- Stage 2: Production ---
# Use the same Node base to avoid runtime mismatches
FROM node:20-bullseye AS runtime

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json again for prod install
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy the compiled code from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Create the uploads directory inside the image if it doesn't exist
RUN mkdir -p /usr/src/app/uploads

# Expose the application port (match your code's listen port)
EXPOSE 5001

# Start the application
CMD [ "node", "dist/app.js" ]
