import re
import json
from bs4 import BeautifulSoup

def main():
    with open('scratch/shopee_debug.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    
    videos = soup.find_all('video')
    print("Video tags found:", len(videos))
    for v in videos:
        print(v)
        
    mp4s = re.findall(r'https?://[^\s\"\']+\.mp4[^\s\"\']*', html)
    print("MP4 links found:", list(set(mp4s)))

    # Look for inline scripts
    for script in soup.find_all('script'):
        content = script.string or ""
        if 'video_url' in content or 'play_url' in content or 'mp4' in content:
            print("Found video-related string in script!")

if __name__ == '__main__':
    main()
