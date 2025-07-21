import os
import urllib.parse
import requests
import re
import string
import time
import sys
from yt_dlp import YoutubeDL
import spotipy
from spotipy import Spotify
import logging

logging.basicConfig(filename="downloader.log", level=logging.INFO, format='%(asctime)s - %(message)s')

if len(sys.argv) < 4:
    print("Usage: python main.py <access_token> <download_path> <playlist_name>")
    sys.exit(1)

access_token = sys.argv[1]
download_path = sys.argv[2]
playlist_name = sys.argv[3]

def sanitize_filename(filename):
    valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)
    return ''.join(c for c in filename if c in valid_chars)

def get_user_playlists(token):
    print("Retrieving user playlists...")
    headers = {"Authorization": "Bearer " + token}
    response = requests.get("https://api.spotify.com/v1/me/playlists", headers=headers)
    response_json = response.json()
    playlists = {}
    for item in response_json["items"]:
        playlists[item["name"]] = item["id"]
    print("Playlists retrieved successfully.")
    return playlists

def get_playlist_tracks(token, playlist_id):
    print(f"Retrieving tracks for playlist ID: {playlist_id}")
    sp = Spotify(auth=token)
    tracks = []
    limit = 100
    offset = 0
    while True:
        response = sp.playlist_tracks(playlist_id, limit=limit, offset=offset)
        tracks.extend(response['items'])
        print(f"Fetched {len(response['items'])} tracks, total: {len(tracks)}")
        if len(response['items']) < limit:
            break
        offset += limit
    print(f"{len(tracks)} tracks retrieved successfully.")
    return tracks

def download_songs(download_folder, playlist_id, token):
    if not os.path.exists(download_folder):
        os.makedirs(download_folder)
    tracks = get_playlist_tracks(token, playlist_id)
    total_tracks = len(tracks)
    for track_num, track in enumerate(tracks, start=1):
        sanitized_track_name = sanitize_filename(f"{track['track']['artists'][0]['name']} - {track['track']['name']}")
        final_file = os.path.join(download_folder, f"{sanitized_track_name}.mp3")
        if os.path.exists(final_file):
            print(f"Skipping, already downloaded: {final_file}")
            continue
        success = False
        retries = 3
        while retries > 0 and not success:
            try:
                print(f"Processing {track['track']['name']} by {track['track']['artists'][0]['name']}... (Track {track_num}/{total_tracks})")
                logging.info(f"Processing {track['track']['name']} by {track['track']['artists'][0]['name']}...")
                search_query = urllib.parse.quote(f"{track['track']['name']} {track['track']['artists'][0]['name']}")
                html = requests.get(f"https://www.youtube.com/results?search_query={search_query}").text
                video_ids = re.findall(r"watch\?v=(\S{11})", html)
                for video_id in video_ids:
                    try:
                        video_url = f"https://www.youtube.com/watch?v={video_id}"
                        ydl_opts = {
                            'format': 'bestaudio/best',
                            'outtmpl': os.path.join(download_folder, f'{sanitized_track_name}.%(ext)s'),
                            'postprocessors': [{
                                'key': 'FFmpegExtractAudio',
                                'preferredcodec': 'mp3',
                                'preferredquality': '192',
                            }],
                            'noplaylist': True
                        }
                        with YoutubeDL(ydl_opts) as ydl:
                            ydl.download([video_url])
                            print(f"Downloaded successfully: {final_file}")
                            logging.info(f"Downloaded successfully: {final_file}")
                            success = True
                            break
                    except Exception as e:
                        print(f"Error downloading video: {e}")
                        logging.error(f"Error downloading video for {track['track']['name']}: {e}")
                        continue
                if not success:
                    retries -= 1
                    print(f"Retrying... {retries} attempts left.")
                    logging.warning(f"Retrying download for {track['track']['name']}... {retries} attempts left.")
                    time.sleep(2)
            except Exception as e:
                print(f"Error processing track {track['track']['name']}: {e}")
                logging.error(f"Error processing track {track['track']['name']}: {e}")
                retries -= 1
        del track
    print("Download completed.")
    logging.info("Download completed for playlist.")

playlists = get_user_playlists(access_token)
if playlist_name not in playlists:
    print(f"Playlist '{playlist_name}' not found. Available playlists: {list(playlists.keys())}")
    sys.exit(1)
playlist_id = playlists[playlist_name]
download_folder = os.path.join(download_path, sanitize_filename(playlist_name).replace(" ", "_"))
download_songs(download_folder, playlist_id, access_token)