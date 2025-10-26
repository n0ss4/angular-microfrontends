# Frontend Multi-Repo

Micro-frontend architecture combining **Native Federation** and **Module Federation** in Angular 17.

## Architecture

| Application | Stack | Port | Type |
|------------|-------|------|------|
| **host-app** | Native Federation + Vite | 4200 | Host |
| **mfe1-app** | Module Federation + Webpack | 4201 | Remote |
| **mfe2-app** | Module Federation + Webpack | 4202 | Remote |
| **mfe3-app** | Native Federation + Vite | 4203 | Remote |

## Quick Start

```bash
# Install all apps
cd host-app && npm install
cd ../mfe1-app && npm install
cd ../mfe2-app && npm install
cd ../mfe3-app && npm install

# Run all apps (separate terminals)
cd host-app && npm start    # http://localhost:4200
cd mfe1-app && npm start    # http://localhost:4201
cd mfe2-app && npm start    # http://localhost:4202
cd mfe3-app && npm start    # http://localhost:4203
```

## Build

```bash
cd host-app && npm run build && cd ../mfe1-app && npm run build && cd ../mfe2-app && npm run build && cd ../mfe3-app && npm run build
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

## Troubleshooting

**Component ID Collision (NG0912)**: Use unique selectors - `host-root`, `mfe1-root`, `mfe2-root`, `mfe3-root`

**Port Conflicts**: Ensure ports 4200-4203 are available

## Resources

[Combining Native and Module Federation](https://www.angulararchitects.io/en/blog/combining-native-federation-and-module-federation/)