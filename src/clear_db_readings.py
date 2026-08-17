import urllib.request
import json

url = 'http://localhost:8080/api/meter-readings/history?size=100'
try:
    req = urllib.request.urlopen(url)
    res = json.loads(req.read().decode('utf-8'))
    content = res.get('content', [])
    print(f"Found {len(content)} meter reading records to delete.")
    for r in content:
        rec_id = r.get('id')
        del_url = f"http://localhost:8080/api/meter-readings/{rec_id}"
        del_req = urllib.request.Request(del_url, method='DELETE')
        try:
            urllib.request.urlopen(del_req)
            print(f"Deleted test record ID {rec_id} ({r.get('nozzleName')})")
        except Exception as e:
            print(f"Error deleting record ID {rec_id}:", e)
    print("Database meter_readings table cleared cleanly!")
except Exception as e:
    print("Error:", e)
