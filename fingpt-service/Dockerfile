FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV MODEL_CACHE_DIR=/cache

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 python3-pip python3.11-dev \
    && rm -rf /var/lib/apt/lists/*

RUN ln -sf /usr/bin/python3.11 /usr/bin/python3 && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app
COPY requirements.txt .

# Install torch first (CUDA build) then rest
RUN pip install --no-cache-dir torch==2.4.1 --index-url https://download.pytorch.org/whl/cu121
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
