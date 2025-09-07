# Functional Manual

This manual provides a detailed overview of all the features available in the UDIO Prompt Crafter.

## Main Interface (Crafter View)

The primary "Crafter" view is split into three resizable panels.

### 1. Categories Panel (Left)

This panel lists all the available tag categories.

-   **Selecting a Category:** Click on a category name to view its tags in the middle panel. The active category is highlighted in blue.
-   **Re-ordering Categories:** Click and drag a category using the grip icon (`⠿`) to change its position. The order of categories here determines the order of tags in the final prompt string, which can influence the AI's focus.
-   **Selection Indicator:** The green dot on the right side of a category indicates that you have at least one tag selected from it.

### 2. Tag Picker Panel (Middle)

This is where you choose the building blocks of your prompt.

-   **Selecting Tags:** Simply click on a tag to add it to your prompt. Click it again to deselect it. Selected tags are highlighted in blue.
-   **Tag Info:** Hover over the small `(i)` icon on any tag to see a tooltip with its description and an example snippet, if available.
-   **Searching:** Use the search bar at the top to filter tags within the current category by name or synonym.
-   **Tree View:** For complex categories, tags are organized in a hierarchical tree view. You can expand or collapse branches to navigate.
-   **Clearing Tags:** If you have tags selected in a category, a "Clear" button will appear at the top right, allowing you to deselect all tags from that category at once.
-   **Text Categories:** Some categories, like "References," are free-form text boxes instead of tag lists. Simply type your desired content here.
-   **AI Lyric Helper:** When you select the "Lyric Helper Keywords" category, a special AI-powered section appears. This is a two-step songwriting assistant:
    1.  **Generate Ideas:** Enter keywords (e.g., "summer, nostalgia, road trip") into the text box. The helper will also consider any selected "Genre" and "Mood" tags. Click "Generate Lyric Ideas," and the AI will produce several distinct themes for a song.
    2.  **Generate Full Lyrics:** Once the ideas appear, each one will have a "Generate Lyrics" button next to it. Clicking this button will take that specific theme and use the AI to write a complete song with a conventional structure (verses, chorus, bridge, etc.).

### 3. Live Preview Panel (Right)

This panel shows you the output of your selections in real-time.

-   **Prompt String Tab:** This is the main view for your output.
    -   **Top Panel (Prompt String):** Shows the final, comma-separated prompt string generated from your tags. You can copy this directly.
    -   **Bottom Panel (AI Features):** This panel contains AI-powered tools to enhance your creativity.
        -   **Generate Description:** Converts your tag list into a descriptive, paragraph-style prompt. The generated text appears in this panel.
        -   **Generate Titles:** Analyzes your prompt to brainstorm five creative song titles. The list of titles will appear in this panel, each with a copy button.
    -   **Resizable Splitter:** You can click and drag the splitter between the two panels to resize them to your preference. Your chosen layout is saved automatically.
-   **UDIO Params Tab:** This tab provides a dedicated form to specify parameters for UDIO. You can toggle if the track is instrumental, provide custom lyrics, and set a target duration in seconds.
-   **JSON Output Tab:** This tab provides a structured JSON object containing your selected tags, text inputs, category order, and UDIO parameters. This is useful for saving, sharing, or for use in other tools.
-   **Conflict Warnings:** If you select tags that are logically incompatible (e.g., "Slow Tempo" and "High Tempo"), a warning box will appear at the top of this panel listing the conflicts.

## Header Controls (Crafter View Only)

These buttons provide quick access to powerful features.

-   **Command Palette (`Ctrl+;`):** A pop-up search bar that lets you instantly find and toggle any tag or execute commands like "Clear All" or "Load Preset."
-   **Prompt History:** Opens a modal showing your last 50 unique prompts. You can click any entry to load it back into the crafter. History entries also save the UDIO Parameters that were active when the prompt was generated.
-   **Manage Presets:** Opens a modal to load, update, rename, or delete your saved presets. Presets now also store any UDIO Parameters you've set.
-   **Save as Preset:** Save your current selections and category order as a new preset.
-   **Deconstruct Prompt with AI:** (Magic wand icon) Opens a modal where you can paste a descriptive, text-based prompt. The AI will analyze it and attempt to select all the matching tags from the taxonomy, replacing your current selection. This is a powerful way to reverse-engineer prompts you find elsewhere.
-   **Randomize:** Selects one random tag from each tag-based category. A great way to find inspiration!
-   **Clear All:** Deselects all tags and clears all text inputs.
-   **Toggle Logs:** Opens or closes the log panel at the bottom of the screen.
-   **Toggle Theme:** Switches between light and dark mode.

## Data Storage (Desktop App)

To behave like a standard installed application, all user-generated data is stored in the operating system's standard user data directory. This includes:

-   `settings.json` (your presets, AI configuration, and app settings)
-   `taxonomy.json` (your custom taxonomy, if you've created one)
-   Log files (`udio-prompt-crafter-YYYY-MM-DD.log`)

This keeps your data safe during application updates and organized according to system standards. The specific location is typically:

-   **Windows:** `%APPDATA%\UDIO Prompt Crafter`
-   **macOS:** `~/Library/Application Support/UDIO Prompt Crafter`
-   **Linux:** `~/.config/UDIO Prompt Crafter`

## Settings Page

Click the "Settings" tab in the header to access the configuration page. The page is organized into cards for clarity.

-   **AI Configuration Tab:**
    -   **Provider:** The app automatically scans for running Ollama or LM Studio services. You can select which one to use for AI features.
    -   **API Base URL:** The address of the AI service. Defaults are provided.
    -   **Model Name:** A dropdown list of models available from your selected provider.
-   **Taxonomy Tab:**
    -   This is an advanced feature allowing full customization of the application's tag library.
    -   **Categories List (Left):** Add, edit, delete, and reorder your categories. Click a category to manage its tags.
    -   **Tags List (Right):** When a category is selected, this area shows all of its tags. You can drag and drop tags to reorder them or create parent-child relationships (for suggestions). Click "Add Tag" or the pencil icon on an existing tag to open the inline editor.
    -   **Inline Tag Editor:** When adding or editing a tag, a panel appears directly on the page. Here you can edit the tag's label, ID, description, color, and manage its "Suggests" and "Conflicts With" relationships using a powerful search-and-select combobox.
    -   **Saving:** Changes are not applied until you click the "Save Taxonomy" button at the top. You can also discard all your changes or reset the entire taxonomy to the application's default. *All destructive actions like deleting or resetting will prompt for confirmation using a themed, in-app dialog.*
-   **Presets Tab:**
    -   Here you can directly edit the JSON data for your custom presets in a code editor that provides syntax highlighting. This allows for advanced editing, re-ordering, and sharing.
    -   You can reset to the application's default presets at any time.
-   **Application Tab:**
    -   Customize the look and feel of the app. You can choose from multiple icon sets (Heroicons, Lucide, Feather, Tabler). For the desktop app, you can also configure developer-centric options. This includes enabling notifications for pre-release (beta) versions and automatically opening the DevTools on startup. A restart is required for the pre-release setting to take effect.

## Info Page

Click the "Info" tab to view application documentation, including the Readme, this functional manual, a technical manual, and the version log.

## Logging

The Log Panel provides a real-time view of application events, which is useful for debugging.

-   **Filter Levels:** You can toggle which log levels (DEBUG, INFO, WARNING, ERROR) are visible.
-   **Log to File (Electron Only):** When running the desktop app, you can enable this to write logs to a file (`udio-prompt-crafter-YYYY-MM-DD.log`) inside the application's standard data directory (see the "Data Storage" section for specific locations).
-   **Open Location (Electron Only):** Opens the folder containing the log file.

## Status Bar

A status bar is present at the bottom of the application window, providing at-a-glance information:

-   **Application Version:** Displays the current version of the app (e.g., `v1.0.0`) when running as a desktop application.
-   **Selected Tags:** Shows a count of the total number of tags currently selected.
-   **Tag Conflicts:** Shows a count of any active tag conflicts. This number will be red if there are one or more conflicts.
-   **AI Service Status:** A colored dot and text indicate the connection status to your local AI service (Ollama or LM Studio).
    -   **Green:** Connected successfully.
    -   **Yellow:** Actively scanning for services.
    -   **Red:** No service detected.
