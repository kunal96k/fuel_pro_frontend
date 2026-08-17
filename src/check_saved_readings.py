import urllib.request
import json
import datetime

url = 'http://localhost:8080/api/meter-readings/history?size=100'
try:
    req = urllib.request.urlopen(url)
    res = json.loads(req.read().decode('utf-8'))
    content = res.get('content', [])
    print(f"Current System Local Date: {datetime.date.today()}")
    print("=" * 80)
    for idx, r in enumerate(content, 1):
        print(f"[{idx}] Record ID: {r.get('id')} | Date Field: {r.get('date')} | Shift Name: '{r.get('shiftName')}'")
        print(f"     Recorded Timestamp (CreatedAt): {r.get('createdAt')}")
        print(f"     MPD: {r.get('mpdName')} | Nozzle: {r.get('nozzleName')}")
        print(f"     Testing Quantity: {r.get('testingQuantity')} L")
        print("-" * 80)
except Exception as e:
    print("Error:", e)
