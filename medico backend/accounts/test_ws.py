import asyncio
import websockets

# JWT token for user ID 41 (valid for 1 hour)
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0MX0.C1wRzRiWkp1mZ_P3qqsOmW4HdePi0_0jTyr8RzBreII"

# WebSocket URL with token in query string
WS_URL = f"ws://127.0.0.1:8000/ws/appointments/?token={JWT_TOKEN}"

async def test_ws():
    try:
        async with websockets.connect(WS_URL) as ws:
            print("✅ Connected to WebSocket!")

            await ws.send('{"type": "test.message", "content": "Hello from test_ws"}')
            print("📤 Sent test message")

            while True:
                response = await ws.recv()
                print("📥 Received:", response)

    except Exception as e:
        print("❌ Error:", e)

if __name__ == "__main__":
    asyncio.run(test_ws())
