# Logistiko Cloud (demo)

Simple Node.js + Express demo for per-client file uploads.

Features:
- JWT login per client
- File upload (10MB limit)
- List, download, delete, share link

Getting started:

1. Install dependencies

   npm install

2. Initialize the database (creates demo users)

   curl -X POST http://localhost:3000/api/init

3. Start the server

   npm start

4. Open http://localhost:3000

Demo credentials (from UI):
- DEMO123 / demo2024
- CLIENT456 / client2024

Notes:
- This is a small demo. For production, use HTTPS, strong secrets, and cloud storage (S3), rate limits, virus scanning.

PM2 (run on boot)
------------------
If you want the app to restart automatically after a reboot, use PM2's startup integration (macOS uses launchd).

1. Generate the startup command (already suggested by PM2):

   sudo env PATH=$PATH:/usr/local/bin pm2 startup launchd -u eirini --hp /Users/eirini

2. Save the current process list so PM2 will resurrect it after reboot:

   npx pm2 save

3. Verify status and logs:

   npx pm2 status
   npx pm2 logs logistiko-cloud

Note: the `sudo` command will ask for your password. Replace `eirini` and `/Users/eirini` with your username/home if different.

Docker (optional)
-----------------
You can run the app in Docker using docker-compose. Create a `.env` with `JWT_SECRET` set, then:

```bash
docker-compose build
docker-compose up -d
```

The app will be available at http://localhost:3000. Uploaded files and the database will be persisted in the project folder via volumes.
