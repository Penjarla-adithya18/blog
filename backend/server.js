const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';

// MongoDB connection
let db;
async function connectDB() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    db = client.db();
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB error:", err);
  }
}

// Helper function to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Create server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // Handle routes
  if (path === '/users') {
    try {
      switch (req.method) {
        case 'GET':
          const users = await db.collection('users').find().toArray();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(users));
          break;

        case 'POST':
          const newUser = await parseBody(req);
          const result = await db.collection('users').insertOne(newUser);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ...newUser, _id: result.insertedId }));
          break;

        default:
          res.writeHead(405);
          res.end('Method not allowed');
      }
    } catch (err) {
      res.writeHead(500);
      res.end('Server error');
    }
  } else if (path.match(/^\/users\/[^/]+$/)) {
    const id = path.split('/')[2];
    try {
      switch (req.method) {
        case 'PUT':
          const updatedUser = await parseBody(req);
          const updateResult = await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedUser }
          );
          if (updateResult.matchedCount === 0) {
            res.writeHead(404);
            res.end('User not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ...updatedUser, _id: id }));
          break;

        case 'DELETE':
          const deleteResult = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
          if (deleteResult.deletedCount === 0) {
            res.writeHead(404);
            res.end('User not found');
            return;
          }
          res.writeHead(204);
          res.end();
          break;

        default:
          res.writeHead(405);
          res.end('Method not allowed');
      }
    } catch (err) {
      res.writeHead(500);
      res.end('Server error');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
