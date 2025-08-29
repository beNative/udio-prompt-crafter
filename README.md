# UDIO Prompt Crafter - Electron Setup

This guide explains how to package and run this application as a standalone desktop app using Electron.

## 1. Install Dependencies

You'll need `esbuild`, `electron`, and `electron-builder`. Install them as development dependencies:

```bash
npm install --save-dev esbuild electron electron-builder
```
or
```bash
yarn add --dev esbuild electron electron-builder
```

## 2. Configure `package.json`

Add the following sections to your `package.json` file.

**A. Add the `main` entry point:**

This tells Electron where to find the main process script after building.

```json
{
  "name": "udio-prompt-crafter",
  "version": "1.0.0",
  "main": "dist/electron/main.js",
  ...
}
```

**B. Add build scripts:**

These scripts will bundle the application and package it.

```json
{
  ...
  "scripts": {
    "build": "node esbuild.config.js",
    "package": "npm run build && electron-builder",
    "start-electron": "npm run build && electron ."
  },
  ...
}
```

**C. Add `electron-builder` configuration:**

This configures how the final application is built for different operating systems.

```json
{
  ...
  "build": {
    "appId": "com.example.udiopromptcrafter",
    "productName": "UDIO Prompt Crafter",
    "files": [
      "dist/**/*"
    ],
    "directories": {
      "output": "release"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png"
    }
  },
  ...
}
```

*Note: You will need to create an `assets` directory with the appropriate icons (`icon.ico`, `icon.icns`, `icon.png`) for this configuration to work.*


## 3. How to Run

1.  **Build the application:**
    ```bash
    npm run build
    ```
    This will create a `dist` folder with the bundled app.

2.  **Run in development mode:**
    ```bash
    npm run start-electron
    ```
    This will build the app and launch it with Electron.

3.  **Package for distribution:**
    ```bash
    npm run package
    ```
    This will create an installer/executable for your current operating system in a `release` folder.
