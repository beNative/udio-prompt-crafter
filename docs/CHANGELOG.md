# Version Log

## v0.6.0 - The Conductor's Update

This update introduces a dedicated panel for UDIO-specific parameters, adds more icon customization options, and includes several UI/UX and stability improvements.

### Features Added
-   **UDIO Parameters Panel:** A new "UDIO Params" tab has been added to the Live Preview panel. You can now specify lyrics, mark a track as instrumental, and set a target duration. These parameters are saved with presets and prompt history.
-   **New Icon Sets:** Added two popular icon libraries, **Feather** and **Tabler**, to the Application settings. Users can now choose from four distinct icon styles.

### Bug Fixes
-   **Persistent AI Content:** Corrected a bug where AI-generated content (Analysis, Description, and Titles) would disappear when the Live Preview panels were resized. This content now persists correctly until the prompt itself is changed.
-   **Preset Panel Layout:** Fixed a layout issue where buttons in the Presets settings tab could be pushed off-screen. The layout now uses a flexible model to ensure buttons are always visible.
-   **JSON Editor Cursor:** Fixed a bug where the text cursor was invisible in the JSON editor.

## v0.5.0 - The Polish & Persistence Update

This update focuses on improving the user experience within the Live Preview panel by fixing a critical bug and refreshing the UI.

### Bug Fixes
-   **Persistent AI Content:** Corrected a bug where AI-generated content (Analysis, Description, and Titles) would disappear when the Live Preview panels were resized. This content now persists correctly until the prompt itself is changed.

### UI Improvements
-   **Button Redesign:** Restyled the "Analyze," "Description," and "Titles" buttons for a cleaner, more professional look that integrates better with both light and dark themes.

## v0.4.0 - The Stability & Workflow Update

This release is a major overhaul focused on improving core stability, workflow efficiency, and the user experience, directly addressing user feedback on persistent bugs and usability issues.

### Major Changes

-   **Complete Tag Editor Refactor:** The buggy and cumbersome tag editing modal has been entirely replaced with a modern, stable, inline editor directly within the "Taxonomy" settings page. Managing tag relationships is now handled through an intuitive combobox with search and "chip"-style display, eliminating all previous layout and usability issues.
-   **AI Song Title Generation:** A new AI feature has been added to the Live Preview panel. The "Generate Titles" button uses your current tags and prompt content to brainstorm five creative song title ideas, each with a convenient copy-to-clipboard button.
-   **Improved Robustness & Debugging:**
    -   The core function for communicating with local AI models has been rewritten for better reliability, including proper request timeouts, more robust JSON parsing, and enhanced error logging.
    -   For the desktop app, a high-priority startup logging system (`debug.log`) has been implemented to help diagnose "white screen" errors and other critical launch failures.
-   **UI/UX Enhancements:** The Settings page and Taxonomy Editor have been refactored to utilize the full available height and width of the application window, providing a much better experience for managing large tag libraries on bigger screens.

## v0.3.0 - The Architect's Toolkit Update

This release adds powerful new features for advanced users, including AI-powered prompt reverse-engineering and an integrated taxonomy editor.

### Features Added

-   **AI Prompt Deconstruction:** A new AI-powered tool (accessible via the "magic wand" icon in the header) that can analyze a descriptive prompt (e.g., from another source) and automatically select the corresponding tags in the crafter.
-   **In-App Taxonomy Editor:** A comprehensive editor has been added to the Settings page. Users can now create, edit, and delete categories and tags directly within the application to fully customize their prompting experience.

## v0.2.0 - The Songwriter's Assistant Update

This release introduces a major enhancement to the AI features, turning the crafter into a powerful songwriting partner.

### Features Added

-   **AI Lyric Helper:** When the "Lyric Helper Keywords" category is selected, a new "AI Lyric Helper" section appears.
    -   **Generate Lyric Ideas:** Users can input keywords and use selected Genre/Mood tags to generate multiple creative lyrical theme ideas.
    -   **Generate Full Lyrics:** After generating ideas, a new "Generate Lyrics" button appears for each theme. Clicking it uses the AI to expand the chosen idea into a complete set of song lyrics with a conventional structure (verses, chorus, bridge).

## v0.1.0 - The Creative Flow Update

This release focuses on streamlining the prompt creation workflow and expanding the creative toolkit.

### Features Added

-   **AI Prompt Description:** A new AI-powered feature has been added directly below the main prompt string. It can generate an evocative, paragraph-style description from your selected tags, perfect for more nuanced results in UDIO.
-   **Resizable Prompt Panel:** The prompt string and AI description text areas can now be resized using a vertical splitter. The layout is automatically saved to your settings.
-   **Prompt History:** The application now automatically saves your last 50 unique prompts. A new "History" button in the header opens a modal where you can view, load, or clear your prompt history.
-   **Expanded Genre Library:** The "Genre & Crossover" category has been significantly expanded with many new popular music styles and their subgenres, including Rock, Metal, Funk, Soul, R&B, Reggae, Country, and more.

## v0.0.1 - Initial Release

This is the first release of the UDIO Prompt Crafter.

### Features Added

-   **Comprehensive Tag Taxonomy:** A large, curated library of tags across categories like Genre, Mood, Era, Instrumentation, Production, Vocals, and more.
-   **Draggable Category Ordering:** Users can drag-and-drop categories to control the structure of the generated prompt.
-   **Live Prompt & JSON Preview:** Real-time feedback on the generated prompt string and a structured JSON output as tags are selected.
-   **Presets System:** Save and load custom combinations of tags and category orders.
-   **AI-Powered Assistance:**
    -   Suggest complementary tags based on current selections.
    -   Generate lyrical theme ideas.
    -   Supports local LLMs via Ollama and LM Studio.
-   **Command Palette:** A powerful search interface (`Ctrl+;`) to quickly find and toggle tags or execute actions.
-   **Light & Dark Mode:** A toggleable theme for user preference.
-   **Resizable Panels:** The three main UI panels can be resized for a customizable layout.
-   **File-Based Settings (Electron):** In the desktop version, all user settings and presets are saved to a persistent `settings.json` file.
-   **In-App Log Viewer:** A real-time log panel to help with debugging, including an option to write logs to a file.
-   **Dedicated Settings Page:** A centralized page for configuring AI settings and manually editing presets.
-   **In-App Documentation:** A new "Info" tab provides access to a Readme, Functional Manual, Technical Manual, and this Version Log.
-   **Status Bar:** A persistent status bar at the bottom of the window displays real-time application info, including selected tag count, conflict count, and AI service connection status.