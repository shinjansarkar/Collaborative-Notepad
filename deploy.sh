#!/bin/bash

echo "🔧 Installing Docker and Docker Compose..."
sudo apt update
sudo apt install -y docker.io docker-compose

# Optional: Start and enable Docker service (if not already)
sudo systemctl start docker
sudo systemctl enable docker

# Optional: Add current user to docker group (will not take effect immediately)
# You can skip this if you always run this script with sudo
# sudo usermod -aG docker $USER

echo "🐳 Pulling Docker images..."
sudo docker pull shinjan7/collabrative_notepad:nginx
sudo docker pull shinjan7/collabrative_notepad:app

echo "🛑 Stopping and removing old containers..."
sudo docker stop my-app-container || true
sudo docker rm my-app-container || true
sudo docker stop nginx-container || true
sudo docker rm nginx-container || true

echo "🚀 Starting new containers..."
sudo docker run -d --name my-app-container shinjan7/collabrative_notepad:app
sudo docker run -d --name nginx-container -p 80:80 --link my-app-container shinjan7/collabrative_notepad:nginx

echo "✅ Deployment complete."
