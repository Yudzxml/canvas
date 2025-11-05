# Gunakan image Node 20 berbasis Debian (aman untuk library native)
FROM node:20-bullseye

# Tentukan direktori kerja
WORKDIR /app

# Install dependency sistem (untuk modul seperti canvas, sharp, dsb.)
RUN apt-get update && apt-get install -y \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libpixman-1-dev \
  build-essential \
  pkg-config \
  python3 \
  && rm -rf /var/lib/apt/lists/*

# Copy file package.json dan package-lock.json (jika ada)
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy semua file aplikasi
COPY . .

# Tentukan port default (Railway otomatis ganti lewat $PORT)
EXPOSE 3000

# Jalankan server.js
CMD ["node", "server.js"]
