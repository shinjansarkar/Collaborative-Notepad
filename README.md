# Collaborative Flask Editor

This is a collaborative text editor built with Flask and Socket.IO that allows multiple users to edit a document in real-time. Users can join a room via a unique URL, and all changes are synced across all participants in real time.

## Features

- **Real-time Collaboration:** Users can edit the document simultaneously, and the changes are reflected in real-time for all participants.
- **Room-based Editing:** Each room has a unique ID, and users join by visiting a URL containing that ID.
- **Dark/Light Mode:** Users can toggle between dark and light themes for a personalized experience.
- **Shareable Link:** Users can share the room link with others to collaborate.
  
## 🛠️ Tech Stack

  Backend: Flask, Flask-SocketIO, Gitlab Integration

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
├── app.py
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── README.md
│
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
│
├── static/
│   └── favicon.png
│
├── templates/
│   ├── editor.html
│   └── landing.html
│
├── tests/
│   ├── __pycache__/
│   │   └── test_app.cpython-313-pytest-8.3.5.pyc
│   └── test_app.py
│
└── __pycache__/
    └── app.cpython-313.pyc

```
### 🐳 Run with Docker

---

### 🐳 Docker Setup

### 1️⃣ Prerequisites

- Docker & Docker Compose installed

# Start the containers
```
docker-compose up -d


```
### Then visit:

```bash
http://localhost:8080/

```
### 🔁 To Stop & Remove 

```bash
docker-compose down


```
