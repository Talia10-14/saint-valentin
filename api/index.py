from http.server import BaseHTTPRequestHandler
import json
import uuid

# Mock Database for the Alpha release
MOCK_MEMORIES = [
    {
        "id": "m1",
        "name": "Premier Rire",
        "emotionType": "Joy",
        "storySnippet": "Un fragment de temps suspendu.",
        "fullStory": "Un fragment de temps suspendu, où le monde s'est arrêté pour écouter votre harmonie.",
        "color": "#ffffff",
        "scale": 1.2
    },
    {
        "id": "m2",
        "name": "Douce Nuit",
        "emotionType": "Tenderness",
        "storySnippet": "Le calme absolu d'une nuit d'été étoilée.",
        "fullStory": "Le calme absolu d'une nuit d'été étoilée, où chaque souffle était une promesse.",
        "color": "#ffffff",
        "scale": 1.0
    }
]

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        path = self.path
        
        if path == '/api/memories':
            self.wfile.write(json.dumps(MOCK_MEMORIES).encode())
        elif path.startswith('/api/memories/'):
            memory_id = path.split('/')[-1]
            memory = next((m for m in MOCK_MEMORIES if m["id"] == memory_id), None)
            if memory:
                self.wfile.write(json.dumps(memory).encode())
            else:
                self.send_error(404, "Memory lost in the void")
        else:
            self.wfile.write(json.dumps({"message": "L'Archéologie du Sentiment API"}).encode())
    
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if self.path == '/api/capture':
            session_id = str(uuid.uuid4())
            response = {
                "sessionId": session_id,
                "checkoutUrl": f"https://checkout.stripe.com/pay/{session_id}"
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_error(404, "Not found")
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
