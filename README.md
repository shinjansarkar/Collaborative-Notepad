<h1 align="center">📓 COLLABORATIVE-NOTEPAD</h1>

<p align="center"><i>Empower Collaboration, Transform Ideas into Reality</i></p>

<p align="center">
  <img alt="Last Commit" src="https://img.shields.io/badge/last%20commit-last%20monday-lightgrey?style=for-the-badge&logo=git">
  <img alt="HTML" src="https://img.shields.io/badge/html-63.1%25-blue?style=for-the-badge&logo=html5">
  <img alt="Languages" src="https://img.shields.io/badge/languages-3-blue?style=for-the-badge">
</p>

<br/>

<p align="center"><i>Built with the tools and technologies:</i></p>

<p align="center">
  <img alt="Flask" src="https://img.shields.io/badge/-Flask-black?style=for-the-badge&logo=flask">
  <img alt="Markdown" src="https://img.shields.io/badge/-Markdown-000000?style=for-the-badge&logo=markdown">
  <img alt="Nginx" src="https://img.shields.io/badge/-NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
  <img alt="Python" src="https://img.shields.io/badge/-Python-3776AB?style=for-the-badge&logo=python&logoColor=white">
</p>

---

## 🚀 About the Project

**Collaborative-Notepad** is a collaborative text editor built using **Flask** and **Socket.IO** that allows multiple users to edit the same document in real time. It's simple, fast, and perfect for instant collaboration.

---

## ✨ Features

- 🔁 **Real-time Collaboration** – See live changes from everyone in the room.
- 🔒 **Room-based Editing** – Unique room ID for each session.
- 🌗 **Dark/Light Theme** – Toggle between light and dark modes.
- 🔗 **Sharable Links** – Copy the room URL and invite collaborators instantly.

---

## 🛠️ Tech Stack

**Backend**  
`Flask`, `Flask-SocketIO`, `eventlet`, `GitLab CI/CD`

**Frontend**  
`HTML`, `CSS`, `JavaScript`, `Socket.IO Client`

**Realtime Communication**  
`WebSockets`

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/collaborative-flask-editor.git
cd collaborative-flask-editor
```
### 2. Create a Virtual Environment

```bash
python -m venv venv
```
# On Windows:
```bash
venv\Scripts\activate
```
# On Linux/macOS:
```bash
source venv/bin/activate
```
### Install the Dependencies
```bash
pip install flask flask-socketio eventlet
```
### Run the Application
```bash
python app.py
```
### Open in Browser
```bash
http://localhost/
```
### 📁 Project Structure
```bash
collaborative-flask-editor/
│
├── Dockerfile              # Container setup
├── docker-compose.yml      # Compose config for multi-service deployment
├── .gitlab-ci.yml          # GitLab CI/CD pipeline definition
├── requirements.txt        # Python dependencies
├── app.py                  # Main Flask application
│
├── templates/
│   ├── landing.html        # Landing page UI
│   └── editor.html         # Collaborative editor interface
│
├── static/
│   └── favicon.png         # App icon
│
└── .gitignore              # Ignored files (env, pycache, etc.)
```

### 🐳 Docker Usage
### ▶️ Run the Container
```bash
docker-compose up -d
```
#### Then open your browser and visit:
```bash
http://localhost/
```
### 🛑 Stop the Container
```bash
docker-compose down

```
