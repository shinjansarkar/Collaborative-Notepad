# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Stage 2: Runner
FROM python:3.11-slim AS runner

WORKDIR /app

RUN adduser --system --group python \
    && chown -R python:python /app
USER python

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /app /app

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.connect(('localhost', 8000)); s.close()" || exit 1

CMD ["python", "app.py"]
