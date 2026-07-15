# Project Demo Script & Walkthrough

Follow this step-by-step script during your final year capstone project evaluation to showcase all features of the AI Voice-to-Text Translator.

---

### Phase 1: Onboarding & Home Screen
1. **Open the browser** and navigate to `http://localhost:5173`.
2. **Present the Home Landing Page**:
   - Point out the clean Apple/Glassmorphism dashboard style.
   - Show the floating animated blobs and gradient text header.
   - Explain the quick architectural summary shown in the "Academic Standards" card.
3. Click the **Launch Translator** button (which triggers a smooth Framer Motion transition to the translation dashboard).

### Phase 2: Live Microphone Recording & Malayalam Translation
1. **Configure languages**:
   - Select **Auto Detect** for the "From" input (shows that Whisper identifies language dynamically).
   - Select **Malayalam** for the "To" input (Malayalam support is mandatory).
2. Click **Start Recording**:
   - Speak clearly into the microphone (e.g., *"Hello, how are you? Welcome to our final year capstone presentation."*).
   - **Show the visualizer**: Point out the live Siri-style bezier curves oscillating on the canvas based on your voice volume.
3. Click **Stop Recording**:
   - The recording ends, and a loading skeleton appears in the translation panel.
   - Point out that the backend resamples the audio to 16kHz mono, applies noise cancellation, and processes the signal.
4. **Review the translation**:
   - The "Original Text" panel displays: *"Hello, how are you? Welcome to our final year capstone presentation."*
   - The detected language badge shows: **English** (detected by Whisper).
   - The "Malayalam Translation" panel displays the accurate translated output.
   - Point out the **Confidence Score** percentage badge.

### Phase 3: Text-to-Speech Playback
1. Click the **Play** button under the Malayalam translation.
2. The browser plays the translated text back as synthesized Malayalam speech using a clear natural voice.
3. **Show speed adjustment**: Select **1.25x** or **0.75x** speed and click play again to demonstrate pitch/speed synthesis adjustments.
4. Click the **Copy** button to copy the translation to the clipboard.
5. Click the **Download** icon to save the translation as a `.txt` file.

### Phase 4: Audio File Drag-and-Drop Upload
1. Navigate to the **Upload Audio File** card.
2. Drag and drop a pre-recorded audio file (WAV, MP3, or AAC) or click to browse and upload.
3. Show that the backend processes the file, updates the text inputs, detects the language, and provides the translation.

### Phase 5: Dashboard Analytics
1. Click on the **Dashboard** tab.
2. **Present the statistics cards**:
   - **Total Requests**: Count of translations processed.
   - **Voice Processed**: Cumulative recording duration.
   - **Confidence Score**: Average transcription accuracy.
   - **Time Saved**: Calculated minutes saved compared to manual translations.
3. Show the **weekly pipeline activity line chart** and **pie chart** reflecting translation frequencies.

### Phase 6: History Logging & Bookmarking
1. Click on the **History** tab.
2. Explain that all transactions are recorded in the local SQLite database.
3. **Show search feature**: Type a keyword in the search bar to show instant filtering.
4. Click the **Star** icon on the Malayalam translation to add it to bookmarks.
5. Click **Filter Bookmarks** to isolate starred items.
6. Click the dropdown arrow on any history item to expand details, showing the full transcript and translated text blocks.
7. Click the **Trash** icon to delete a record.

### Phase 7: Theme & System Customization
1. Click on the **Settings** tab.
2. Click **Theme** toggle (demonstrate immediate toggle between Dark Mode and Light Mode).
3. Select a new **Accent Theme** (Cyan or Violet) and show that the button highlights and borders change colors immediately.
4. **Show Health Diagnostics**: Click the refresh icon next to "Health Checks" to show the API status and verify the models are loaded.
