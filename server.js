const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JSON_FILE = 'financial_data.json';

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware for parsing JSON and serving static files
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Ensure JSON file exists
async function ensureJsonFile() {
  try {
    await fs.access(JSON_FILE);
    console.log('Existing JSON file found');
  } catch {
    console.log('Creating new JSON file');
    const initialData = {
      incomes: [],
      expenses: [],
      savingsGoal: 0,
      currentSavings: 0
    };
    await fs.writeFile(JSON_FILE, JSON.stringify(initialData, null, 2));
  }
}

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    await ensureJsonFile();
    const data = await fs.readFile(JSON_FILE, 'utf8');
    console.log('Data read successfully');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Error reading data' });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    if (!req.body) {
      throw new Error('No data received');
    }
    await fs.writeFile(JSON_FILE, JSON.stringify(req.body, null, 2));
    console.log('Data saved successfully');
    res.json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Error saving data' });
  }
});

// Server status route
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Server running correctly' });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server function
async function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port)
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} in use, trying next port...`);
          server.close();
          resolve(startServer(port + 1));
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        const actualPort = server.address().port;
        console.log(`Server running at http://localhost:${actualPort}`);
        resolve(actualPort);
      });
  });
}

// Initialize server
async function initialize() {
  try {
    await ensureJsonFile();
    const actualPort = await startServer(PORT);
    const clientConfig = {
      serverUrl: `http://localhost:${actualPort}`
    };
    await fs.writeFile('config.json', JSON.stringify(clientConfig, null, 2));
    console.log('Client configuration updated');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

initialize();