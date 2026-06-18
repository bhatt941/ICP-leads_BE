const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 5173);
const distDir = path.join(__dirname, 'FE', 'project FE', 'dist');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

function resolveFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://127.0.0.1:${port}`).pathname);
  const requestedPath = path.normalize(path.join(distDir, pathname));
  if (!requestedPath.startsWith(distDir)) return path.join(distDir, 'index.html');
  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) return requestedPath;
  return path.join(distDir, 'index.html');
}

http.createServer((req, res) => {
  const filePath = resolveFile(req.url);
  const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(error.message);
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`Static frontend available at http://127.0.0.1:${port}`);
});
