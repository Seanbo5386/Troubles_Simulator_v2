const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 8080;
const server = http.createServer((req, res) => {
    // Parse URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Get file extension
    const ext = path.extname(pathname).toLowerCase();
    
    // Map file extensions to content types
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg'
    };
    
    const contentType = mimeTypes[ext] || 'text/plain';
    
    // Build file path
    const filePath = path.join(__dirname, pathname);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>');
            return;
        }
        
        // Read and serve file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 Internal Server Error</h1><p>Error reading file.</p>');
                return;
            }
            
            // Set CORS headers for development
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            
            res.end(data);
        });
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log('Open your browser and navigate to http://localhost:8080 to play the game!');
    console.log('Press Ctrl+C to stop the server.');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nServer shutting down...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});