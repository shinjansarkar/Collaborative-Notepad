# Collaborative Flask Editor

This is a collaborative text editor built with Flask and Socket.IO that allows multiple users to edit a document in real-time. Users can join a room via a unique URL, and all changes are synced across all participants in real time.

## Features

- **Real-time Collaboration:** Users can edit the document simultaneously, and the changes are reflected in real-time for all participants.
- **Room-based Editing:** Each room has a unique ID, and users join by visiting a URL containing that ID.
- **Dark/Light Mode:** Users can toggle between dark and light themes for a personalized experience.
- **Shareable Link:** Users can share the room link with others to collaborate.
  
## 🛠️ Tech Stack

  Backend: Flask, Flask-SocketIO

  Frontend: HTML, CSS, JavaScript, Socket.IO (Client)

  Realtime Communication: WebSockets

## Installation

Follow these steps to get the project up and running:

### 1. Clone the repository

```bash
git clone https://github.com/your-username/collaborative-flask-editor.git

cd collaborative-flask-editor
```
### Create a Virtual Environment

```bash

python -m venv venv

venv\Scripts\activate
```
### Install Dependencies

```bash
pip install flask flask-socketio eventlet
```
### Run the App

```bash
python app.py

```
### open in your browser 

```bash
http://localhost:5000/

```
### 🗂️ Project Structure

```bash

Collaborative-Notepad/
│
├── __pycache__/              # Compiled Python files (auto-generated)
├── nginx/                    # Contains Nginx configuration files
├── static/                   # Static assets (CSS, JS, favicon, etc.)
├── templates/                # HTML templates (Jinja2)
├── tests/                    # Unit tests
│
├── .gitignore                # Git ignored files
├── Dockerfile                # Dockerfile for the Flask app
├── docker-compose.yml        # Docker Compose configuration
├── requirements.txt          # Python dependencies
├── app.py                    # Main Flask application



```
### 🐳 Run with Docker
#### If you prefer Docker, the image is available on Docker Hub.

#### 🧱 Pull the Image

```bash
docker pull shinjan7/flask-collaborative-notepad:latest

```
### ▶️ Run the Container

```bash
docker run -d -p 5000:5000 --name collab-notepad shinjan7/flask-collaborative-notepad:latest

```
### Then visit:

```bash
http://localhost:5000/

```
### 🔁 To Stop & Remove 

```bash
docker stop collab-notepad
docker rm collab-notepad

```
