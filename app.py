import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, redirect, url_for, request, abort
from flask_socketio import SocketIO, emit, join_room
import uuid

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

docs = {}  # Stores all documents by room ID

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/start')
def start_collaboration():
    room_id = str(uuid.uuid4())[:8]
    docs[room_id] = ""
    return redirect(url_for('editor', room_id=room_id))

@app.route('/favicon.ico')
def favicon():
    return redirect(url_for('static', filename='favicon.png'))

@app.route('/room/<room_id>')
def editor(room_id):
    if room_id not in docs:
        abort(404)
    return render_template('editor.html', room_id=room_id, content=docs[room_id])

@socketio.on('join')
def join(data):
    room = data['room']
    if room not in docs:
        emit('error', {'message': 'Room not found'}, to=request.sid)
        return
    join_room(room)
    emit('load_content', docs.get(room, ""), to=request.sid)

@socketio.on('update')
def update(data):
    room = data['room']
    content = data['content']
    if room not in docs:
        emit('error', {'message': 'Room not found'}, to=request.sid)
        return
    docs[room] = content
    emit('update', content, to=room, skip_sid=request.sid)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)  # Removed debug=True
