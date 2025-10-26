# Frontend Multi-Repo

Micro-frontend architecture combining **Native Federation** and **Module Federation** in Angular 17.

## Architecture

| Application | Stack | Port | Type |
|------------|-------|------|------|
| **host-app** | Native Federation + Vite | 4200 | Host |
| **mfe1-app** | Module Federation + Webpack | 4201 | Remote |
| **mfe2-app** | Module Federation + Webpack | 4202 | Remote |
| **mfe3-app** | Native Federation + Vite | 4203 | Remote |
| **mfe4-app** | Module Federation + Webpack + Angular Elements | 4204 | Web Component |

## Quick Start

### Development Mode (Using Scripts - Recommended)

```bash
# Start all applications in development mode
./scripts/dev/start.sh

# Stop all applications
./scripts/dev/stop.sh

# Restart all applications
./scripts/dev/restart.sh
```

**Access URLs:**
- Host: http://localhost:4200
- MFE1: http://localhost:4201
- MFE2: http://localhost:4202
- MFE3: http://localhost:4203
- MFE4: http://localhost:4204

Logs are saved in `./logs/` directory.

### Manual Start

```bash
# Install all apps
cd host-app && npm install
cd ../mfe1-app && npm install
cd ../mfe2-app && npm install
cd ../mfe3-app && npm install
cd ../mfe4-app && npm install

# Run all apps (separate terminals)
cd host-app && npm start    # http://localhost:4200
cd mfe1-app && npm start    # http://localhost:4201
cd mfe2-app && npm start    # http://localhost:4202
cd mfe3-app && npm start    # http://localhost:4203
cd mfe4-app && npm start    # http://localhost:4204
```

## Production Deployment

### Complete Deployment (Automated)

Deploy everything in one command:

```bash
# Build apps + Build Docker images + Start containers
./scripts/prod/deploy.sh
```

This script runs all steps sequentially and stops if any step fails.

### Step-by-Step Deployment

#### 1. Build Applications

```bash
# Build all apps for production
./scripts/prod/build-all.sh
```

#### 2. Build Docker Images

```bash
# Build Docker images (will run build-all.sh if needed)
./scripts/prod/docker-build.sh
```

#### 3. Manage Containers

```bash
# Start containers
./scripts/prod/docker-up.sh

# Stop containers
./scripts/prod/docker-down.sh

# Restart containers
./scripts/prod/docker-restart.sh
```

**Access URLs (Production via Gateway):**
- Gateway: http://localhost (port 80)
- Host: http://localhost/
- MFE1: http://localhost/mfe1/
- MFE2: http://localhost/mfe2/
- MFE3: http://localhost/mfe3/
- MFE4: http://localhost/mfe4/

All applications are served through a single nginx reverse proxy gateway on port 80.

### Manual Docker Commands

```bash
# Build and start all containers
docker-compose up -d

# Stop all containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f host-app
```

### Build Individual Docker Images

```bash
# Build specific app image
cd host-app
docker build -t angular-mf/host-app:latest --build-arg APP_NAME=host-app .

# Run specific container
docker run -d -p 4200:8080 --name host-app angular-mf/host-app:latest
```

## Recreate from Scratch

**Host (Native Federation)**
```bash
npx @angular/cli@17 new host-app --routing --style=scss --standalone
ng add @angular-architects/native-federation@17 --project host-app --type host
```

**MFE1 & MFE2 (Module Federation)**
```bash
npx @angular/cli@17 new mfe1-app --routing --style=scss --standalone
ng add @angular-architects/module-federation@16 --project mfe1-app --port 4201 --type remote
```

**MFE3 (Native Federation)**
```bash
npx @angular/cli@17 new mfe3-app --routing --style=scss --standalone
ng add @angular-architects/native-federation@17 --project mfe3-app --port 4203 --type remote
```

**MFE4 (Module Federation + Angular Elements - Web Component)**
```bash
npx @angular/cli@16 new mfe4-app --routing --style=scss --standalone
ng add @angular-architects/module-federation@16 --project mfe4-app --port 4204 --type remote
npm install @angular/elements
# Create bootstrap-elements.ts to define the web component
# Modify webpack.config.js to expose './WebComponent'
```

## Troubleshooting

**Component ID Collision (NG0912)**: Use unique selectors - `host-root`, `mfe1-root`, `mfe2-root`, `mfe3-root`, `mfe4-root`

**Port Conflicts**: Ensure ports 4200-4204 are available

## Resources

[Combining Native and Module Federation](https://www.angulararchitects.io/en/blog/combining-native-federation-and-module-federation/)
[Multiple microfrontends with Module Federation](https://www.angulararchitects.io/blog/the-microfrontend-revolution-part-2-module-federation-with-angular/)