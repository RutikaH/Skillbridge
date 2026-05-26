import json
import time
import urllib.error
import urllib.request

base = 'http://127.0.0.1:8000'
email = f"test{int(time.time())}@example.com"
payload = {'name': 'Test User', 'email': email, 'password': 'Testpass123'}
req = urllib.request.Request(
    f'{base}/auth/signup', data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as resp:
        auth = json.loads(resp.read().decode())
        print('signup', auth)
        token = auth['access_token']

        req2 = urllib.request.Request(
            f'{base}/auth/login',
            data=json.dumps({'email': email, 'password': 'Testpass123'}).encode(),
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req2) as login_resp:
            print('login', json.loads(login_resp.read().decode()))

        req3 = urllib.request.Request(f'{base}/auth/me', headers={'Authorization': f'Bearer {token}'})
        with urllib.request.urlopen(req3) as me_resp:
            print('me', json.loads(me_resp.read().decode()))

        req4 = urllib.request.Request(
            f'{base}/start?language=English',
            method='POST',
            headers={'Authorization': f'Bearer {token}'},
        )
        with urllib.request.urlopen(req4) as start_resp:
            print('start', start_resp.read().decode())
except urllib.error.HTTPError as exc:
    print('HTTPError', exc.code, exc.read().decode())
except Exception as exc:
    print('Exception', exc)
