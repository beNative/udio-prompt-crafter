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
-   **Text Categories:** Some categories, like "Lyrics" or "References," are free-form text boxes instead of tag lists. Simply type your desired content here.

### 3. Live Preview Panel (Right)

This panel shows you the output of your selections in real-time.

-   **Prompt String Tab:** This shows the final, formatted prompt string. It combines all your selected tags and text inputs, separated by semicolons. You can copy this directly for use in UDIO.
-   **JSON Output Tab:** This tab provides a structured JSON object containing your selected tags, text inputs, and category order. This is useful for saving, sharing, or for use in other tools.
-   **Conflict Warnings:** If you select tags that are logically incompatible (e.g., "Slow Tempo" and "High Tempo"), a warning box will appear at the top of this panel listing the conflicts.

## Header Controls (Crafter View Only)

These buttons provide quick access to powerful features.

-   **Command Palette (`Ctrl+;`):** A pop-up search bar that lets you instantly find and toggle any tag or execute commands like "Clear All" or "Load Preset."
-   **Macros:** Apply a pre-defined set of tags to quickly establish a foundational style.
-   **Presets:** Load a previously saved combination of selected tags and category order.
-   **Save as Preset:** Save your current selections and category order as a new preset.
-   **Randomize:** Selects one random tag from each tag-based category. A great way to find inspiration!
-   **Clear All:** Deselects all tags and clears all text inputs.
-   **Toggle Logs:** Opens or closes the log panel at the bottom of the screen.
-   **Toggle Theme:** Switches between light and dark mode.

## Settings Page

Click the "Settings" tab in the header to access the configuration page. The page is organized into cards for clarity.

-   **AI Configuration Card:**
    -   **Provider:** The app automatically scans for running Ollama or LM Studio services. You can select which one to use for AI features.
    -   **API Base URL:** The address of the AI service. Defaults are provided.
    -   **Model Name:** A dropdown list of models available from your selected provider.
-   **Presets & Macros Card:**
    -   Here you can directly edit the JSON data for your custom presets and macros in a code editor that provides syntax highlighting. This allows for advanced editing, re-ordering, and sharing.
    -   You can reset to the application's default presets and macros at any time.

## Info Page

Click the "Info" tab to view application documentation, including the Readme, this functional manual, a technical manual, and the version log.

## Logging

The Log Panel provides a real-time view of application events, which is useful for debugging.

-   **Filter Levels:** You can toggle which log levels (DEBUG, INFO, WARNING, ERROR) are visible.
-   **Log to File (Electron Only):** When running the desktop app, you can enable this to write logs to a file (`udio-prompt-crafter-YYYY-MM-DD.log`) in the same directory as the executable.
-   **Open Location (Electron Only):** Opens the folder containing the log file.