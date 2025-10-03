# Version Log

## v0.17.1 - The Release Prep Patch

This maintenance release focuses on polishing the release workflow so that the desktop builds and documentation stay in sync.

### Documentation
-   Refreshed the Electron packaging guide with cross-platform commands and publishing guidance so new contributors can ship builds without guesswork.
-   Added a dedicated release workflow checklist covering version bumps, changelog updates, and GitHub release preparation.

### Bug Fixes
-   Corrected outdated references in the packaging instructions that could lead to incomplete installers on macOS and Linux.

## v0.17.0 - The Integrated Experience Update

This major release overhauls the application's look and feel by introducing a custom title bar and fully integrating the command palette, creating a more modern and seamless user experience similar to VS Code.

### Features Added
-   **Custom Title Bar:** The native OS title bar has been replaced with a custom, frameless window that matches the application's theme.
-   **Integrated Search Palette:** The command palette search is now built directly into the title bar. Results appear in a dropdown panel directly below the search input, replacing the old centered modal.
-   **Custom Window Controls:** The title bar includes custom-drawn minimize, maximize, and close buttons for a seamless cross-platform experience.

### Bug Fixes
-   **Tooltip Scaling Fix:** Corrected a positioning bug where tooltips would appear in the wrong location when the UI scale was set to anything other than 100%.

## v0.16.0 - The Creative Control Update

This release introduces powerful new features for fine-tuning the creative process, offering more control over randomization and assistance in naming presets.

### Features Added
-   **Tag Locking:** Selected tags in the Crafter view now feature a lock icon. Locked tags are preserved during both Simple and Thematic Randomization, allowing users to fix core concepts (like genre or mood) while exploring variations. The lock state is also saved with presets and history.
-   **AI Preset Naming:** A "magic wand" icon now appears in the "Save Preset" and "Rename Preset" dialogs. Clicking it uses AI to analyze the preset's tags and suggest several creative names, streamlining the saving workflow.

## v0.15.0 - The Visualizer Update

This release brings a major user experience enhancement by creating a beautiful, dedicated gallery for presets, making them a central and highly visual part of the creative workflow.

### Features Added
-   **Preset Gallery Tab:** Presets have been moved from a settings modal to a dedicated, top-level "Presets" tab in the main UI for easier access.
-   **Visual Preset Cards:** Preset cards have been completely redesigned to be more informative and space-efficient. Instead of a simple tag count, they now display the actual tags, prefixed with a colored dot corresponding to their category.
-   **Copy Prompt from Card:** A new "Copy" button has been added to each preset card, allowing users to copy the full prompt string to their clipboard with a single click.
-   **Cohesive UI Coloring:** The selected category in the "Crafter" view now uses its assigned color as its background, creating a more consistent and intuitive visual language throughout the app.

## v0.14.0 - The Conductor's Baton Update

This release gives users finer control over their creative process, much like a conductor guiding an orchestra. It introduces more flexible conflict resolution and robust preset management.

### Features Added
-   **Enhanced Conflict Resolution:** When selecting a tag that conflicts with multiple existing tags, a new modal appears, listing all conflicts. It provides three choices: keep the new tag (deselecting all conflicts), keep both (overriding the rule), or cancel.
-   **Preset Renaming:** Presets can now be renamed directly within the "Manage Presets" modal. The feature includes validation to prevent duplicate names.
-   **Delete Confirmation:** A confirmation dialog has been added when deleting a preset to prevent accidental data loss.

## v0.13.0 - The Phoenix Update

This release focuses on internal refinement and stability. Like a phoenix, the codebase has been renewed, resulting in a cleaner, more reliable foundation for future features.

### Refinements & Fixes
-   **Icon Set Refresh:** Replaced corrupted icon sets (Heroicons, Lucide) with fresh copies to ensure they render correctly. The default icon set for new users is now 'Feather'.
-   **Codebase Cleanup:** Performed a major code cleanup, removing over five obsolete files and unused code to improve performance and maintainability. Global styles were also centralized for better organization.

## v0.12.0 - The Power User Update

This update introduces a suite of features for advanced users, offering deeper control over application settings and a more refined user experience.

### Features Added
-   **Data Management Tab:** A new "Data Management" section has been added to the Settings page. It includes a raw JSON editor for all application settings, along with import/export functionality.
-   **Open Settings Location:** For the desktop app, a button is now available in the Data Management tab to directly open the folder containing the `settings.json` file.
-   **UI Scale Apply Button:** The UI Scale slider in the Application settings now has an "Apply" button. The interface will no longer resize in real-time while dragging the slider, providing a more controlled experience.

## v0.11.0 - The Accessibility & Comfort Update

This major update introduces a much-requested accessibility feature, allowing users to tailor the application's size to their specific needs and preferences.

### Features Added
-   **UI Scale Slider:** A new slider has been added to the 'Application' settings tab, allowing users to scale the entire user interface from 50% to 400%. This setting is saved and applied on startup, improving accessibility and viewing comfort on different screen sizes.

## v0.10.0 - The Readability & Refinement Update

This release focuses on improving UI clarity and overall user experience with small but impactful refinements.

### UI Improvements
-   **Opaque Tooltips:** All tooltips are now fully opaque and theme-aware (solid light/dark backgrounds), significantly improving readability against any background content.

## v0.9.0 - The Customization & Polish Update

This release adds more flexibility for Windows users during installation and provides a cleaner, more focused user interface.

### Features Added
-   **Custom Installation Path:** The Windows installer now provides an installation wizard, allowing users to choose a custom installation directory.

### UI Improvements
-   **Cleaner Header:** The main "UDIO Prompt Crafter" title has been removed from the application header for a more streamlined and less cluttered look.

## v0.8.0 - The Integration Update

This update changes the application's data storage behavior from a "portable" model to the standard installed application model. All user data, including settings, presets, custom taxonomies, and logs, are now stored in the appropriate system user data directory (`%APPDATA%` on Windows, `~/Library/Application Support` on macOS, etc.). This ensures better system integration and prevents clutter in the application's installation folder.

### Architectural Changes
-   **Standard Data Location:** User data is now stored in `app.getPath('userData')` instead of next to the executable. This makes the application a better citizen on the user's operating system.
-   **Documentation:** All user-facing documentation has been updated to reflect this new standard behavior.

## v0.7.0 - The Consistency Update

This update introduces custom, consistently styled modals for all confirmation dialogs and alerts throughout the application, replacing native OS-level dialogs. This significantly improves the user interface's visual consistency and attractiveness.

### UI Improvements
-   **Custom Confirmation Modals:** All `confirm()` dialogs (e.g., when deleting a category or saving taxonomy changes) have been replaced with a custom modal component that matches the application's theme.
-   **Custom Alert Modals:** All `alert()` messages (e.g., for duplicate preset names) now use a custom, themed alert modal.
-   **Inline Validation:** Validation errors in the Category and Tag editors are now shown as inline error messages directly under the input fields, providing a smoother editing experience.

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