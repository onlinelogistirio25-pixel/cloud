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

Render deploy
-------------
To deploy the app on Render (quick, free tier available):

1. Create a Render account at https://render.com and connect your GitHub account.
2. In Render dashboard click New → Web Service.
3. Choose "Github" and select the repository: `onlinelogistirio25-pixel/cloud` (branch `main`).
4. For Environment choose `Docker` (we included a Dockerfile) or `Node`.
   - Build Command: `npm ci --omit=dev`
   - Start Command: `npm start`
5. Add an environment variable in Render: `JWT_SECRET` with a strong value.
6. Create the service — Render will build and deploy and provide an HTTPS URL.

Alternatively you can use the provided `render.yaml` for GitHub auto-deploys via Render's dashboard (import from repo).

Healthcheck
-----------
The app exposes a lightweight health endpoint:

   GET /health

It returns JSON { status: 'ok', time: <timestamp> } and can be used by uptime monitors.

S3 (optional)
-------------
To store uploads in S3 instead of the server disk, set the following environment variables on Render or your host:

   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   AWS_REGION

The repo includes a small `s3.js` helper. If you want, I can integrate direct S3 upload (replace multer disk storage with S3 streaming) — tell me and I'll prepare a PR.

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
