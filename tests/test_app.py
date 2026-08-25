import sys
import os

# Ensure server module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'server')))

import pytest
from app import app, socketio, docs

@pytest.fixture
def client():
    app.config['TESTING'] = True
    docs.clear()
    with app.test_client() as client:
        yield client

def test_root_endpoint(client):
    response = client.get('/')
    assert response.status_code == 200
    data = response.get_json()
    assert data["service"] == "Collaborative Notepad Backend"
    assert data["status"] == "running"

def test_healthz_endpoint(client):
    response = client.get('/healthz')
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"

def test_api_version_endpoint(client):
    response = client.get('/api/v1')
    assert response.status_code == 200
    data = response.get_json()
    assert data["name"] == "Collaborative Notepad API"

def test_create_and_check_room(client):
    response = client.post('/api/v1/room', json={'userId': 'user-123'})
    assert response.status_code == 201
    data = response.get_json()
    assert 'room_id' in data
    room_id = data['room_id']

    # Check room endpoint
    check_resp = client.get(f'/api/v1/room/{room_id}')
    assert check_resp.status_code == 200
    check_data = check_resp.get_json()
    assert check_data['exists'] is True
    assert check_data['admin_id'] == 'user-123'

def test_socketio_join_and_realtime_sync():
    docs.clear()
    client1 = socketio.test_client(app)
    client2 = socketio.test_client(app)

    # Join room with client 1
    client1.emit('join', {'room': 'test-room', 'userId': 'user-1'})
    r1 = client1.get_received()
    assert len(r1) > 0

    # Join room with client 2
    client2.emit('join', {'room': 'test-room', 'userId': 'user-2'})
    r2 = client2.get_received()
    assert len(r2) > 0

    # Client 1 sends content update
    client1.emit('update', {'room': 'test-room', 'content': 'Hello from User 1', 'userId': 'user-1'})

    # Client 2 should receive the real-time update
    r2_updates = client2.get_received()
    update_events = [e for e in r2_updates if e['name'] == 'update']
    assert len(update_events) == 1
    assert update_events[0]['args'][0] == 'Hello from User 1'