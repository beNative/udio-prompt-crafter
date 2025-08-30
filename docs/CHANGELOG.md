# Version Log

## v1.2.0 - The Songwriter's Assistant Update

This release introduces a major enhancement to the AI features, turning the crafter into a powerful songwriting partner.

### Features Added

-   **AI Lyric Helper:** When the "Lyric Helper Keywords" category is selected, a new "AI Lyric Helper" section appears.
    -   **Generate Lyric Ideas:** Users can input keywords and use selected Genre/Mood tags to generate multiple creative lyrical theme ideas.
    -   **Generate Full Lyrics:** After generating ideas, a new "Generate Lyrics" button appears for each theme. Clicking it uses the AI to expand the chosen idea into a complete set of song lyrics with a conventional structure (verses, chorus, bridge).

## v1.1.0 - The Creative Flow Update

This release focuses on streamlining the prompt creation workflow and expanding the creative toolkit.

### Features Added

-   **AI Prompt Description:** A new AI-powered feature has been added directly below the main prompt string. It can generate an evocative, paragraph-style description from your selected tags, perfect for more nuanced results in UDIO.
-   **Resizable Prompt Panel:** The prompt string and AI description text areas can now be resized using a vertical splitter. The layout is automatically saved to your settings.
-   **Prompt History:** The application now automatically saves your last 50 unique prompts. A new "History" button in the header opens a modal where you can view, load, or clear your prompt history.
-   **Expanded Genre Library:** The "Genre & Crossover" category has been significantly expanded with many new popular music styles and their subgenres, including Rock, Metal, Funk, Soul, R&B, Reggae, Country, and more.

## v1.0.0 - Initial Release

This is the first public release of the UDIO Prompt Crafter.

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