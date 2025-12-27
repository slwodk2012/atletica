#!/bin/bash
# Скрипт деплоя сайта Атлетика на VPS
# VPS: 91.240.87.126, Ubuntu 24.04, ISPmanager 6

echo "=== Начинаем деплой сайта Атлетика ==="

# 1. Обновляем систему
apt update && apt upgrade -y

# 2. Устанавливаем Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Устанавливаем PM2 для управления процессами
npm install -g pm2

# 4. Устанавливаем Git
apt install -y git

# 5. Создаем директорию для сайта
mkdir -p /var/www/atletica
cd /var/www/atletica

# 6. Клонируем репозиторий
git clone https://github.com/slwodk2012/atletica.git .

# 7. Создаем server.js для Node.js сервера с API
cat > server.js << 'SERVEREOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

// MIME types
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: Save trainers
  if (req.method === 'POST' && req.url === '/api/save-trainers') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Validate data structure
        if (!data.products || !Array.isArray(data.products)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid data format' }));
          return;
        }

        // Backup current file
        const backupFile = DATA_FILE.replace('.json', `-backup-${Date.now()}.json`);
        if (fs.existsSync(DATA_FILE)) {
          fs.copyFileSync(DATA_FILE, backupFile);
        }

        // Save new data
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        
        console.log(`[${new Date().toISOString()}] Saved ${data.products.length} trainers`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: data.products.length }));
      } catch (error) {
        console.error('Save error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // API: Get trainers
  if (req.method === 'GET' && req.url === '/api/trainers') {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // API: Delete trainer
  if (req.method === 'DELETE' && req.url.startsWith('/api/trainer/')) {
    const trainerId = req.url.split('/').pop();
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const initialLength = data.products.length;
      data.products = data.products.filter(p => p.id !== trainerId);
      
      if (data.products.length < initialLength) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log(`[${new Date().toISOString()}] Deleted trainer: ${trainerId}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Trainer not found' }));
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
    return;
  }

  // API: Add/Update trainer
  if (req.method === 'PUT' && req.url === '/api/trainer') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const trainer = JSON.parse(body);
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        
        const index = data.products.findIndex(p => p.id === trainer.id);
        if (index !== -1) {
          data.products[index] = trainer;
          console.log(`[${new Date().toISOString()}] Updated trainer: ${trainer.title}`);
        } else {
          data.products.push(trainer);
          console.log(`[${new Date().toISOString()}] Added trainer: ${trainer.title}`);
        }
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // API: Upload video
  if (req.method === 'POST' && req.url === '/api/upload-video') {
    const chunks = [];
    let totalSize = 0;
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    
    req.on('data', chunk => {
      totalSize += chunk.length;
      if (totalSize > maxSize) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'File too large (max 100MB)' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        // Parse multipart form data manually
        const boundary = req.headers['content-type'].split('boundary=')[1];
        const parts = buffer.toString('binary').split('--' + boundary);
        
        let filename = '';
        let fileData = null;
        let videoType = 'trainer'; // or 'hero'
        
        for (const part of parts) {
          if (part.includes('filename=')) {
            const filenameMatch = part.match(/filename="([^"]+)"/);
            if (filenameMatch) {
              filename = filenameMatch[1];
            }
            
            const typeMatch = part.match(/name="type"[\r\n]+([^\r\n]+)/);
            if (typeMatch) {
              videoType = typeMatch[1].trim();
            }
            
            // Extract file content
            const headerEnd = part.indexOf('\r\n\r\n');
            if (headerEnd !== -1) {
              const content = part.substring(headerEnd + 4);
              // Remove trailing boundary markers
              const endIndex = content.lastIndexOf('\r\n');
              fileData = Buffer.from(content.substring(0, endIndex), 'binary');
            }
          }
          
          if (part.includes('name="type"') && !part.includes('filename=')) {
            const valueStart = part.indexOf('\r\n\r\n');
            if (valueStart !== -1) {
              videoType = part.substring(valueStart + 4).trim().replace(/[\r\n-]/g, '');
            }
          }
        }
        
        if (!filename || !fileData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'No file uploaded' }));
          return;
        }
        
        // Generate safe filename
        const ext = path.extname(filename).toLowerCase() || '.mp4';
        const safeName = 'video_' + Date.now() + ext;
        const savePath = videoType === 'hero' 
          ? path.join(__dirname, safeName)
          : path.join(__dirname, 'videos', safeName);
        
        // Create videos directory if needed
        if (videoType !== 'hero') {
          const videosDir = path.join(__dirname, 'videos');
          if (!fs.existsSync(videosDir)) {
            fs.mkdirSync(videosDir, { recursive: true });
          }
        }
        
        fs.writeFileSync(savePath, fileData);
        
        const videoUrl = videoType === 'hero' ? '/' + safeName : '/videos/' + safeName;
        console.log(`[${new Date().toISOString()}] Uploaded video: ${videoUrl}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, url: videoUrl, filename: safeName }));
      } catch (error) {
        console.error('Upload error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // API: Get/Set hero video
  if (req.url === '/api/hero-video') {
    const settingsFile = path.join(__dirname, 'data', 'settings.json');
    
    if (req.method === 'GET') {
      try {
        if (fs.existsSync(settingsFile)) {
          const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ heroVideo: settings.heroVideo || 'ОБЛОЖКА.mp4' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ heroVideo: 'ОБЛОЖКА.mp4' }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }
    
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { heroVideo } = JSON.parse(body);
          let settings = {};
          if (fs.existsSync(settingsFile)) {
            settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
          }
          settings.heroVideo = heroVideo;
          fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
          console.log(`[${new Date().toISOString()}] Updated hero video: ${heroVideo}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
      return;
    }
  }

  // Static files
  let filePath = req.url.split('?')[0]; // Remove query string
  if (filePath === '/') filePath = '/index.html';
  
  // Decode URL (for Russian filenames)
  filePath = decodeURIComponent(filePath);
  
  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try index.html for SPA routing
        fs.readFile(path.join(__dirname, 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(404);
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      // Cache control for static assets
      if (['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp4', '.mov'].includes(ext)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Atletica server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET  /api/trainers - Get all trainers`);
  console.log(`  POST /api/save-trainers - Save all trainers`);
  console.log(`  PUT  /api/trainer - Add/Update trainer`);
  console.log(`  DELETE /api/trainer/:id - Delete trainer`);
});
SERVEREOF

echo "=== server.js создан ==="

# 8. Запускаем сервер через PM2
pm2 start server.js --name atletica
pm2 save
pm2 startup

# 9. Настраиваем Nginx
cat > /etc/nginx/sites-available/atletica << 'NGINXEOF'
server {
    listen 80;
    server_name 91.240.87.126;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for large files
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase max body size for file uploads
    client_max_body_size 50M;
}
NGINXEOF

# 10. Активируем конфиг Nginx
ln -sf /etc/nginx/sites-available/atletica /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 11. Проверяем и перезапускаем Nginx
nginx -t && systemctl restart nginx

echo ""
echo "=== ДЕПЛОЙ ЗАВЕРШЕН ==="
echo ""
echo "Сайт доступен по адресу: http://91.240.87.126"
echo ""
echo "Команды управления:"
echo "  pm2 status        - статус сервера"
echo "  pm2 logs atletica - логи сервера"
echo "  pm2 restart atletica - перезапуск"
echo ""
echo "Для обновления сайта:"
echo "  cd /var/www/atletica && git pull && pm2 restart atletica"
echo ""
