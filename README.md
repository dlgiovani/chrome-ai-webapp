# Chrome AI Assistant WebApp

This app succesfully creates a session and keeps context, the the built-in AI will remember what you asked.

This is the first program to make the local Gemini instance fully remember the context, as far as I am concerned.

This app does not uses any wrappers for the built-in AI.

You can visit a live version [here](https://github.com/dlgiovani/chrome-ai-webapp/tree/main), but keep in mind that you'll need to have a proper environment (as described below) to use it.

> [!NOTE]
> this is an experimental feature in Chrome, and available only in more advanced versions.

This AI accesses an offline API provided locally by Chrome versions 128 or above.

### Steps to Access the API

1. **Ensure Compatibility:**
   - Verify you are using Chrome version 128 or above. If not, consider downloading:
     - [**Canary** (nightly builds)](https://www.google.com/chrome/canary/)
     - [**Dev** (for developers)](https://www.google.com/chrome/dev/)

2. **Enable Required Flags:**
   - Open Chrome and type `chrome://flags` in the URL bar.
   - Set the following flags:
     - `Enables optimization guide on device` to `Enabled BypassPerfRequirements`
     - `Prompt API for Gemini Nano` to `Enabled`

3. **Download the Optimization Guide:**
   - Relaunch Chrome.
   - Open Chrome again and type `chrome://components` in the URL bar.
   - Find the component named **Optimization Guide On Device Model** and download it (approximately 1.5 GB).

4. **Final Steps:**
   - Relaunch Chrome.
   - If everything is set up correctly, you can start using the AI. Otherwise, `window.ai` will be undefined.
