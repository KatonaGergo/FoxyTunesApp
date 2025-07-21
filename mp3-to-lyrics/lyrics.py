import whisper
import threading
import time
import tkinter as tk
from tkinter import filedialog, messagebox
import pygame
import os
import json

CACHE_EXT = ".transcript.json"

CURRENT_SONG_JSON = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public/current_song.json'))
SONGS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public/songs'))

class LyricsApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Whisper Lyrics Player")
        self.root.geometry("600x400")

        self.load_button = tk.Button(root, text="Load MP3", command=self.load_mp3)
        self.load_button.pack(pady=10)

        self.status_label = tk.Label(root, text="No file loaded.")
        self.status_label.pack()

        self.lyrics_box = tk.Text(root, wrap="word", font=("Helvetica", 14), state="disabled", bg="#f0f0f0")
        self.lyrics_box.pack(expand=True, fill="both", padx=10, pady=10)

        self.segments = []
        self.playing = False

        pygame.mixer.init()

        # Load Whisper model ONCE here for performance, use bigger model for accuracy
        self.model = whisper.load_model("medium")  # small, medium, large for more accuracy, but slower

        self.last_auto_song = None

    def load_mp3(self):
        songs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public/songs'))
        file_path = filedialog.askopenfilename(initialdir=songs_dir, filetypes=[("MP3 files", "*.mp3")])
        if not file_path:
            return

        self.status_label.config(text="Checking for cached transcript...")
        self.load_button.config(state="disabled")
        self.lyrics_box.config(state="normal")
        self.lyrics_box.delete("1.0", tk.END)
        self.lyrics_box.insert(tk.END, "Loading...\n")
        self.lyrics_box.config(state="disabled")

        threading.Thread(target=self.process_file, args=(file_path,), daemon=True).start()

    def process_file(self, file_path):
        # Set cache directory to frontend/public/song-transcription
        cache_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend/public/song-transcription'))
        os.makedirs(cache_dir, exist_ok=True)
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        cache_path = os.path.join(cache_dir, base_name + CACHE_EXT)

        if os.path.exists(cache_path):
            # Load cached transcript
            with open(cache_path, "r", encoding="utf-8") as f:
                self.segments = json.load(f)
            self.root.after(0, self.status_label.config, {"text": "Loaded cached transcript. Starting playback..."})
        else:
            # Transcribe and cache
            self.root.after(0, self.status_label.config, {"text": "Transcribing audio, please wait..."})
            result = self.model.transcribe(file_path, language="en", word_timestamps=False)  
            # Save segments to cache
            self.segments = result["segments"]
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(self.segments, f, ensure_ascii=False, indent=2)
            self.root.after(0, self.status_label.config, {"text": "Transcription done. Starting playback..."})

        # Start playback and syncing lyrics on GUI thread
        self.root.after(0, self.start_playback, file_path)

    def start_playback(self, file_path):
        pygame.mixer.music.load(file_path)
        pygame.mixer.music.play()

        self.playing = True
        self.lyrics_box.config(state="normal")
        self.lyrics_box.delete("1.0", tk.END)
        self.lyrics_box.config(state="disabled")

        self.sync_lyrics()

    def sync_lyrics(self):
        if not self.playing:
            return

        current_time = pygame.mixer.music.get_pos() / 1000  # milliseconds to seconds

        current_segment = None
        for seg in self.segments:
            if seg["start"] <= current_time <= seg["end"]:
                current_segment = seg
                break

        if current_segment:
            self.show_lyrics(current_segment["text"])

        self.root.after(200, self.sync_lyrics)

    def show_lyrics(self, text):
        self.lyrics_box.config(state="normal")
        self.lyrics_box.delete("1.0", tk.END)
        self.lyrics_box.insert(tk.END, text)
        self.lyrics_box.config(state="disabled")

    def start_auto_lyrics(self):
        def poll():
            while True:
                try:
                    if os.path.exists(CURRENT_SONG_JSON):
                        with open(CURRENT_SONG_JSON, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                        filename = data.get('filename')
                        if filename and filename != self.last_auto_song:
                            mp3_path = os.path.join(SONGS_DIR, filename)
                            if os.path.exists(mp3_path):
                                self.last_auto_song = filename
                                self.root.after(0, self.status_label.config, {"text": f"Auto: Loading {filename}..."})
                                self.root.after(0, self.process_file, mp3_path)
                    time.sleep(2)
                except Exception as e:
                    print("Auto-lyrics error:", e)
                    time.sleep(5)
        threading.Thread(target=poll, daemon=True).start()

def main():
    root = tk.Tk()
    app = LyricsApp(root)
    app.start_auto_lyrics()  # Start the polling thread
    root.mainloop()

if __name__ == "__main__":
    main()
