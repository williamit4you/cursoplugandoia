from curl_cffi import requests

try:
    url = "https://shopee.com.br/api/v4/item/get?shopid=952449950&itemid=22797032581"
    r = requests.get(url, impersonate="chrome110")
    print(r.text[:200])
except Exception as e:
    print("Error:", e)
