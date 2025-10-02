# UDIO Prompt Crafter - Electron Setup

This guide explains how to package and run this application as a standalone desktop app using Electron.

## 1. Install Dependencies

You'll need `esbuild`, `electron`, and `electron-builder`. Install them as development dependencies:

```bash
npm install
```

## 2. Configure `package.json`

The `package.json` file is already configured with the necessary scripts and settings.

-   **`main`**: The entry point `dist/electron/main.js` tells Electron where to find the main process script after building.
-   **`scripts`**:
    -   `npm run build`: Bundles the application into the `dist` folder.
    -   `npm run start-electron`: Builds the app and launches it in a development window.
    -   `npm run package`: Creates an installer for your current operating system.
    -   `npm run package-win`: Creates a Windows installer (`.exe`).
-   **`build`**: This section configures `electron-builder`.

*Icon pipeline:* place a single SVG (e.g. `assets/app-icon.svg`) in the project. The build script validates the SVG and rasterises it into platform assets automatically. If the SVG is missing or cannot be processed, a procedural fallback icon is generated. The resulting Windows (`.ico`), macOS (`.icns`), and Linux (`.png`) assets are saved to `dist/icons` and referenced by the Electron Builder configuration.

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

3.  **Package for Windows:**
    ```bash
    npm run package-win
    ```
    This will create a Windows installer in a `release` folder.
