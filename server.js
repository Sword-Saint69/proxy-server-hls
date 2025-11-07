import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(cors());

// Serve the playlist file
app.get('/playlist', (req, res) => {
  const playlistPath = join(__dirname, 'myplaylist.m3u8');
  
  // Check if the playlist file exists
  if (!existsSync(playlistPath)) {
    return res.status(404).send('Playlist file not found');
  }
  
  // Set the correct content type for HLS playlists
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.sendFile(playlistPath);
});

// Serve segment files
app.get('/segments/:segmentName', (req, res) => {
  const { segmentName } = req.params;
  
  // Validate segment name to prevent directory traversal
  if (!segmentName || segmentName.includes('..') || segmentName.startsWith('/')) {
    return res.status(400).send('Invalid segment name');
  }
  
  // Check if the file has a valid extension
  if (!segmentName.endsWith('.ts')) {
    return res.status(400).send('Invalid file type');
  }
  
  const segmentPath = join(__dirname, 'segments', segmentName);
  
  // Check if the segment file exists
  if (!existsSync(segmentPath)) {
    return res.status(404).send('Segment file not found');
  }
  
  // Set cache headers for segments
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.setHeader('Content-Type', 'video/mp2t');
  res.sendFile(segmentPath);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).send('Internal Server Error');
});

// Start the server
app.listen(port, () => {
  console.log(`HLS Playlist Proxy server listening on port ${port}`);
  console.log(`Playlist available at: http://localhost:${port}/playlist`);
  console.log(`Segments available at: http://localhost:${port}/segments/:segmentName`);
});

export default app;