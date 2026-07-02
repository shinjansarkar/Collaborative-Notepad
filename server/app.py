import time
import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import uuid

app = Flask(__name__)
# Enable CORS for all REST API routes starting with /api/
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Enable CORS for Socket.IO connections
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

docs = {}

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

@app.route('/api/room/<room_id>', methods=['GET'])
def check_room(room_id):
    if room_id not in docs:
        return jsonify({"error": "Room not found", "exists": False}), 404
    
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
    
    # Grant lock if it's free or if the same user is renewing it
    if current_lock is None or current_lock == user_id:
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
    
    # Only allow update if lock is free or held by this user
    if current_lock is None or current_lock == user_id:
        room_data["content"] = content
        emit('update', content, to=room, skip_sid=request.sid)
        
        # Auto-renew lock timestamp on active typing
        if current_lock == user_id:
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
    socketio.run(app, host='0.0.0.0', port=8000)
