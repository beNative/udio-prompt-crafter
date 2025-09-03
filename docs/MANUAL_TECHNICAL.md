# Technical Architecture Manual

This document provides a technical overview of the UDIO Prompt Crafter application architecture.

## Overview

The application is built using modern web technologies and packaged as a cross-platform desktop application with Electron.

-   **Frontend Framework:** React 18
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **Bundler:** esbuild
-   **Desktop Wrapper:** Electron
-   **Installer Builder:** Electron Builder

## Frontend (Renderer Process)

The user interface is a single-page application (SPA) built with React.

### Core Libraries & Concepts

-   **React:** The entire UI is composed of React components. Key components include `App.tsx` (the root), `Header.tsx`, `CategoryList.tsx`, `TagPicker.tsx`, and `PromptPreview.tsx`.
-   **TypeScript:** Provides static typing for improved code quality and maintainability. All core application logic and component props are strongly typed, with definitions located in `types.ts`.
-   **Tailwind CSS:** A utility-first CSS framework used for all styling. A base configuration with a custom color palette is defined directly in `index.html`.

### State Management

Application state is managed primarily through React's built-in hooks:

-   **`App.tsx`:** This root component acts as the primary state container, holding the most critical pieces of state like `selectedTags`, `categories`, `appSettings`, etc.
-   **`useState`:** Used for managing local component state.
-   **`useEffect`:** Used for side effects, such as loading data on startup, responding to state changes, and managing event listeners.
-   **`useMemo` & `useCallback`:** Used extensively to optimize performance by memoizing expensive calculations (like generating the tag map or filtering tags) and preventing unnecessary re-renders.
-   **`useLocalStorage`:** A custom hook (`hooks/useLocalStorage.ts`) provides a simple abstraction for persisting UI state (like theme and panel sizes) to the browser's localStorage.
-   A new state object, `udioParams`, is managed in `App.tsx` to hold UDIO-specific values like lyrics and instrumental status. This object is passed down to the `PromptPreview` component and is included in saved presets and history entries.

### Data Flow

The application follows a standard unidirectional data flow.

1.  State is held in the main `App.tsx` component.
2.  State and callback functions (e.g., `onToggleTag`) are passed down as props to child components.
3.  User interactions in child components (e.g., clicking a tag in `TagChip.tsx`) call the callback functions.
4.  The callback functions update the state in `App.tsx`.
5.  React re-renders the affected components with the new state.

## Backend (Main Process - Electron)

When running as a desktop app, a Node.js environment managed by Electron runs in the background.

### Purpose

The main process is responsible for tasks that the sandboxed renderer (browser) process cannot do for security reasons.

-   Creating and managing the application window (`BrowserWindow`).
-   Accessing the native file system to read and write settings and logs.
-   Handling inter-process communication (IPC) with the renderer process.

### Inter-Process Communication (IPC)

Secure communication between the frontend and backend is achieved via Electron's `contextBridge`.

-   **`electron/main.ts`:** This file contains the main process logic. It uses `ipcMain.handle` and `ipcMain.on` to listen for events from the frontend.
-   **`electron/preload.ts`:** This script runs in a privileged environment. It uses `contextBridge.exposeInMainWorld` to securely expose specific functions (e.g., `readSettings`, `writeLog`) to the renderer process under the `window.electronAPI` global object. This avoids exposing the full `ipcRenderer` and Node.js APIs to the frontend.

### Settings & Data Persistence

In Electron mode, application settings (presets, AI config) are stored in `settings.json` within the user's application data directory (e.g., `%APPDATA%` on Windows). This provides a robust and standard way to persist user data. The `main.ts` process handles all file read/write operations for this file.

## Build System

-   **`esbuild.config.js`:** A custom build script using `esbuild` handles the bundling and transformation of the TypeScript/React source code into JavaScript that can run in the browser and Node.js. It creates separate bundles for the main app, the Electron main process, and the preload script.
-   **`electron-builder`:** This tool, configured in `package.json`, takes the output from the build script and packages it into distributable installers for Windows, macOS, and Linux. It also handles packaging extra resources like the documentation files.

## Core Data

-   **`public/taxonomy.json`:** This JSON file is the heart of the application. It defines all the categories, tags, descriptions, relationships (conflicts/suggestions), and metadata. The application fetches this file on startup to build its internal data structures.