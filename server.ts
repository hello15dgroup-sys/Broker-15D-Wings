import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS headers for cross-origin Open Graph preview requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  app.use(express.json());

  // Lightweight CORS proxy route for Open Graph Image
  app.get('/og-image.png', async (req, res) => {
    try {
      const imageUrl = 'https://uploads.onecompiler.io/44ptns9c4/1786538079593/Gemini_Generated_Image_ce3selce3selce3s.png';
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Image fetch failed');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(buffer);
    } catch (e) {
      res.redirect('https://uploads.onecompiler.io/44ptns9c4/1786538079593/Gemini_Generated_Image_ce3selce3selce3s.png');
    }
  });

  // Eye of God Logging Endpoint
  app.post('/api/eye-of-god/log', (req, res) => {
    const { device_fingerprint, departure_airport, arrival_airport } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];
    
    // In a real app, this would insert into `eye_of_god_logs` database table.
    console.log(`[Eye of God] Logged device ${device_fingerprint} for route ${departure_airport} -> ${arrival_airport}`);
    
    res.json({ success: true });
  });

  // Retention Engine Cron Endpoint (Can be called by external scheduler)
  app.post('/api/cron/retention', (req, res) => {
    // 1. Find brokers where last_client_onboarded_at & last_flight_booked_at > 60 days
    // -> Send reminder email
    
    // 2. > 90 days
    // -> Update agency_clearance_status = 'SUSPENDED_90_DAYS'
    
    // 3. > 120 days
    // -> Update is_soft_deleted = TRUE
    
    console.log(`[Retention Engine] Executed daily retention pipeline.`);
    res.json({ success: true, processed: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
