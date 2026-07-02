## Auto Docker Setup Notes

This setup provides a production-ready containerized environment for your API-only Python Flask application, including a reverse proxy with Nginx.

### 1. Project Structure:
Ensure your project files are organized as follows:
```
. (project root)
├── app.py          # Your main Flask application file (or similar)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── .dockerignore
```

**Important:** Your Flask application should have an instance named `app` in `app.py` (e.g., `app = Flask(__name__)`) for the `gunicorn app:app` command to work. If your app instance is named differently or is created via a factory function, adjust the `CMD` in the `Dockerfile` accordingly.

### 2. Quick Start (Production Deployment):
To build and run your entire stack in detached mode:
```bash
docker-compose up -d --build
```
This command will:
- Build the `app` service using the `Dockerfile`.
- Create and start the `app` container.
- Create and start the `nginx` container.
- Set up a custom network for communication between `app` and `nginx`.

### 3. Environment Variables:
- Create a `.env` file in your project root for environment variables used by `docker-compose.yml` (e.g., `API_KEY=your_secret_key`).
- The `docker-compose.yml` is configured to automatically load variables from this file.

### 4. Access URLs & Port Mappings:
- **API Access**: Your API will be accessible via Nginx on standard HTTP (port 80) and HTTPS (port 443, once configured).
  - If running locally, access your API at `http://localhost`.
  - If deployed to a server, use `http://your_domain.com`.
- **Internal Communication**: The `app` service listens on port `5000` internally within the Docker network, but it's not directly exposed to the host machine. Nginx proxies requests to it.

### 5. Nginx Configuration:
- The `nginx.conf` is set up as a reverse proxy, routing all incoming requests to your `app` service.
- **SSL**: The `nginx.conf` includes commented-out blocks for SSL configuration. To enable HTTPS:
    1. Obtain your SSL certificate (`fullchain.pem`) and private key (`privkey.pem`).
    2. Create a `certs` directory in your project root (e.g., `./certs/fullchain.pem`, `./certs/privkey.pem`).
    3. Uncomment the `volumes` section for `nginx` in `docker-compose.yml` to mount the `certs` directory.
    4. Uncomment and configure the `server` block for port `443` in `nginx.conf`, updating `ssl_certificate` and `ssl_certificate_key` paths if necessary.
    5. Uncomment the HTTP to HTTPS redirect in the port 80 `server` block.
- **Rate Limiting**: A basic rate limit of 10 requests/second with a burst of 20 is applied to all API endpoints. Adjust `limit_req_zone` and `limit_req` in `nginx.conf` as needed.
- **Security Headers**: Essential security headers are included. Customize `Content-Security-Policy` for your specific needs.

### 6. Health Checks:
- The `Dockerfile` includes a `HEALTHCHECK` instruction that pings `http://localhost:5000/health`.
- Your Flask application **must implement a `/health` endpoint** that returns a 200 OK status for the health check to pass.
- `docker-compose.yml` also defines a health check for the `app` service, leveraging the Dockerfile's health check.

### 7. Development vs. Production:
- This setup is optimized for production. For development, you might want to:
    - Mount your local code into the container (`./:/app` in `docker-compose.yml`) to enable live reloading.
    - Use a simpler `flask run` command instead of `gunicorn`.
    - Consider a `docker-compose.override.yml` file to manage development-specific configurations without altering the production `docker-compose.yml`.

### 8. Stopping and Removing:
To stop the services:
```bash
docker-compose stop
```
To stop and remove containers, networks, and volumes:
```bash
docker-compose down
```
To remove dangling images (optional, for cleanup):
```bash
docker image prune
```

Remember to replace `your_domain.com` with your actual domain in `nginx.conf` if deploying to a public server.