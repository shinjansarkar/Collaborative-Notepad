# tests/test_app.py
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, socketio

import pytest
from app import app, socketio

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_landing_page(client):
    response = client.get('/')
    assert response.status_code == 200

def test_start_collaboration(client):
    response = client.get('/start')
    assert response.status_code == 302  # Redirect
    assert '/room/' in response.location

def test_editor_page(client):
    response = client.get('/room/nonexistent')
    assert response.status_code == 404

def test_favicon(client):
    response = client.get('/favicon.ico')
    assert response.status_code == 302  # Redirect to static favicon

def test_socketio_join():
    client = socketio.test_client(app)
    client.emit('join', {'room': 'nonexistent'})
    received = client.get_received()
    assert received[0]['name'] == 'error'
    assert received[0]['args'][0]['message'] == 'Room not found'