from curl_cffi import requests
url = "https://shopee.com.br/2026-Smartwatch-T10-Ultra-3-Nova-S%C3%A9rie-10-SmartWatch-2.09-Inch-HD-49mm-Bluetooth-Com-Calculadora-i.952449950.22797032581"
try:
    r = requests.get(url, impersonate="chrome110")
    html = r.text
    if "video_info_list" in html or "mp4" in html:
        print("BINGO! Video found in HTML.")
    else:
        print("HTML length:", len(html))
        print("Title snippet:", html[:1000])
except Exception as e:
    print(e)
