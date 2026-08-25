import time
import os
import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room
from werkzeug.exceptions import HTTPException
import uuid
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")


def parse_cors_origins(raw_origins):
    value = (raw_origins or "").strip()
    if not value or value == "*":
        return "*"
    return [origin.strip() for origin in value.split(",") if origin.strip()]


ALLOWED_CORS_ORIGINS = parse_cors_origins(CORS_ORIGINS)
API_NAME = "Collaborative Notepad API"
API_VERSION = "1.0.0"

app = Flask(__name__)
# Same-origin Socket.IO traffic is proxied through Nginx.
socketio = SocketIO(
    app,
    async_mode='eventlet',
    cors_allowed_origins=ALLOWED_CORS_ORIGINS,
)

docs = {}


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")

    if ALLOWED_CORS_ORIGINS == "*":
        response.headers["Access-Control-Allow-Origin"] = origin or "*"
    elif origin and origin in ALLOWED_CORS_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin

    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Vary"] = "Origin"
    return response


@app.errorhandler(HTTPException)
def handle_http_exception(error):
    response = jsonify({
        "error": error.name,
        "message": error.description,
    })
    return response, error.code


@app.errorhandler(Exception)
def handle_unexpected_exception(error):
    app.logger.exception("Unhandled server error", exc_info=error)
    return jsonify({
        "error": "Internal Server Error",
        "message": "An unexpected error occurred.",
    }), 500


# Service discovery endpoint for uptime checks and reverse-proxy health verification.
@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "service": "Collaborative Notepad Backend",
        "status": "running",
    }), 200


# API version discovery endpoint for REST clients.
@app.route("/api/v1", methods=["GET"])
def api_version():
    return jsonify({
        "name": API_NAME,
        "version": API_VERSION,
    }), 200

def get_room_active_users(room_id):
    if room_id not in docs: return []
    room_data = docs[room_id]
    active_sids = room_data["active_sessions"]
    admin_id = room_data["admin_id"]
    known_viewers = room_data["known_viewers"]
    
    unique_active_users = set(active_sids.values())
    users_list = []
    
    for uid in unique_active_users:
        if uid == admin_id:
            users_list.append({"id": uid, "role": "Admin"})
        elif uid in known_viewers:
            users_list.append({"id": uid, "role": known_viewers[uid]})
        else:
            users_list.append({"id": uid, "role": "Viewer"})
            
    # Sort so Admin is always first, then Viewer 1, Viewer 2, etc.
    def sort_key(u):
        if u["role"] == "Admin": return -1
        # Extract number from "Viewer X"
        try:
            return int(u["role"].split(" ")[1])
        except:
            return 999
            
    return sorted(users_list, key=sort_key)

def get_user_role(room_data, user_id):
    if user_id == room_data["admin_id"]:
        return "Admin"
    elif user_id in room_data["known_viewers"]:
        return room_data["known_viewers"][user_id]
    return "Viewer"


# Standard health check endpoint for Docker, Nginx, and orchestration probes.
@app.route('/healthz', methods=['GET'])
def healthz():
    return jsonify({"status": "ok"}), 200

# Versioned room creation endpoint, kept in sync with the legacy alias below.
@app.route('/api/v1/room', methods=['POST'])
# Backward-compatible room creation alias for existing clients.
@app.route('/api/room', methods=['POST'])
def create_room():
    data = request.json or {}
    user_id = data.get('userId')
    if not user_id:
        user_id = str(uuid.uuid4())
        
    room_id = str(uuid.uuid4())[:8]
    docs[room_id] = {
        "content": "",
        "admin_id": user_id,
        "known_viewers": {},
        "viewer_count": 0,
        "active_sessions": {},
        "typing_lock": { "user_id": None, "role": None, "timestamp": 0 }
    }
    return jsonify({"room_id": room_id}), 201

def is_lock_expired(typing_lock):
    if not typing_lock.get("user_id"):
        return True
    return (time.time() - typing_lock.get("timestamp", 0)) > 3.0


# Versioned room lookup endpoint, kept in sync with the legacy alias below.
@app.route('/api/v1/room/<room_id>', methods=['GET'])
# Backward-compatible room lookup alias for existing clients.
@app.route('/api/room/<room_id>', methods=['GET'])
def check_room(room_id):
    if room_id not in docs:
        docs[room_id] = {
            "content": "",
            "admin_id": None,
            "known_viewers": {},
            "viewer_count": 0,
            "active_sessions": {},
            "typing_lock": { "user_id": None, "role": None, "timestamp": 0 }
        }
    
    return jsonify({
        "room_id": room_id,
        "exists": True,
        "content": docs[room_id]["content"],
        "admin_id": docs[room_id]["admin_id"]
    }), 200

@socketio.on('join')
def join(data):
    room = data.get('room')
    user_id = data.get('userId')
    
    if not room or not user_id:
        emit('error', {'message': 'Room or User ID not specified'}, to=request.sid)
        return
        
    # Auto-create if missing for backward compatibility
    if room not in docs:
        docs[room] = {
            "content": "",
            "admin_id": user_id, # First person to join an empty room becomes Admin
            "known_viewers": {},
            "viewer_count": 0,
            "active_sessions": {},
            "typing_lock": { "user_id": None, "role": None, "timestamp": 0 }
        }
        
    room_data = docs[room]
    
    # Register viewer if not admin and not already known
    if user_id != room_data["admin_id"] and user_id not in room_data["known_viewers"]:
        room_data["viewer_count"] += 1
        room_data["known_viewers"][user_id] = f"Viewer {room_data['viewer_count']}"
        
    # Register session
    room_data["active_sessions"][request.sid] = user_id
    join_room(room)
    
    emit('load_content', room_data["content"], to=request.sid)
    emit('lock_status', room_data["typing_lock"], to=request.sid)
    
    # Broadcast updated active users
    active_users = get_room_active_users(room)
    emit('users_update', active_users, to=room)

@socketio.on('typing_start')
def typing_start(data):
    room = data.get('room')
    user_id = data.get('userId')
    if not room or not user_id or room not in docs:
        return
        
    room_data = docs[room]
    current_lock = room_data["typing_lock"]["user_id"]
    
    # Grant lock if it's free, if the same user is renewing it, or if previous lock expired
    if current_lock is None or current_lock == user_id or is_lock_expired(room_data["typing_lock"]):
        room_data["typing_lock"] = {
            "user_id": user_id,
            "role": get_user_role(room_data, user_id),
            "timestamp": time.time()
        }
        emit('lock_status', room_data["typing_lock"], to=room)

@socketio.on('typing_end')
def typing_end(data):
    room = data.get('room')
    user_id = data.get('userId')
    if not room or not user_id or room not in docs:
        return
        
    room_data = docs[room]
    # Only release the lock if the user requesting release actually holds it
    if room_data["typing_lock"]["user_id"] == user_id:
        room_data["typing_lock"] = { "user_id": None, "role": None, "timestamp": 0 }
        emit('lock_status', room_data["typing_lock"], to=room)

@socketio.on('update')
def update(data):
    room = data.get('room')
    content = data.get('content', '')
    user_id = data.get('userId')
    
    if not room or room not in docs:
        return
        
    room_data = docs[room]
    current_lock = room_data["typing_lock"]["user_id"]
    
    # Only allow update if lock is free, held by this user, or expired
    if current_lock is None or current_lock == user_id or is_lock_expired(room_data["typing_lock"]):
        room_data["content"] = content
        emit('update', content, to=room, skip_sid=request.sid)
        
        # Auto-renew lock timestamp on active typing
        if current_lock == user_id or is_lock_expired(room_data["typing_lock"]):
            room_data["typing_lock"]["user_id"] = user_id
            room_data["typing_lock"]["role"] = get_user_role(room_data, user_id)
            room_data["typing_lock"]["timestamp"] = time.time()

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    # Find which room this SID was in and remove them
    for room_id, room_data in docs.items():
        if sid in room_data["active_sessions"]:
            user_id = room_data["active_sessions"][sid]
            del room_data["active_sessions"][sid]
            
            # If they held the lock, release it
            if room_data["typing_lock"]["user_id"] == user_id:
                room_data["typing_lock"] = { "user_id": None, "role": None, "timestamp": 0 }
                emit('lock_status', room_data["typing_lock"], to=room_id)
                
            active_users = get_room_active_users(room_id)
            emit('users_update', active_users, to=room_id)
            break

@socketio.on('ping_latency')
def handle_ping():
    return True

if __name__ == '__main__':
    socketio.run(app, host=SERVER_HOST, port=SERVER_PORT)
