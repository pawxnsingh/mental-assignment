FROM python:3.13

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt ./

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && curl https://sh.rustup.rs -sSf | sh -s -- -y \
    && echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> /etc/environment \
    && pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

WORKDIR /app/server/

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --no-input && python manage.py runserver 0.0.0.0:8000"]
