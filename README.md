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
    -   `npm run package-mac`: Builds a signed `.dmg` for macOS (requires macOS host or CI runner).
    -   `npm run package-linux`: Generates an AppImage for Linux distributions.
    -   `npm run publish`: Builds the app and uploads artifacts using the GitHub release provider configured in `package.json`.
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

4.  **Package for macOS:**
    ```bash
    npm run package-mac
    ```
    Use this on macOS or a macOS-capable CI runner to produce a `.dmg` installer.

5.  **Package for Linux:**
    ```bash
    npm run package-linux
    ```
    The resulting AppImage is stored under `release/`.

6.  **Publish a Release Build:**
    ```bash
    npm run publish
    ```
    This command runs the build pipeline and publishes installers and metadata to the GitHub release configured in `package.json`.

## 4. Prepare a Release

Before cutting a release (manual or via CI), run through this checklist:

1.  **Update versioning:** Bump the `version` field in `package.json` and align any in-app references if needed.
2.  **Refresh documentation:** Review `README.md` and the docs in `docs/` to ensure new features and workflow tweaks are captured.
3.  **Write release notes:** Add a new entry to `docs/CHANGELOG.md` summarizing key fixes and enhancements.
4.  **Verify builds:** Run `npm run build` locally and spot-check platform packages as required.
5.  **Tag & publish:** Push the changes, create a Git tag (e.g. `git tag vX.Y.Z && git push --tags`), and then run `npm run publish` or draft the GitHub release with the changelog entry.

Keeping this list handy ensures that every GitHub release has consistent binaries, documentation, and notes.
