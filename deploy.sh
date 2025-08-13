#!/bin/bash

echo "🔧 Installing Docker and Docker Compose..."
sudo apt update
sudo apt install -y docker.io docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

echo "📂 Cloning repository..."
# Remove old repo if it exists
rm -rf Collaborative-Notepad
git clone https://github.com/shinjansarkar/Collaborative-Notepad.git
cd Collaborative-Notepad

echo "🐳 Pulling and starting containers with Docker Compose..."
sudo docker-compose pull
sudo docker-compose up -d

echo "✅ Deployment complete."
