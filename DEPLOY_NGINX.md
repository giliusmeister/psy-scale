# Deploy With Nginx

This guide describes a typical production setup:

- Nginx serves the built React frontend from `dist`
- the questionnaire API runs as a separate Node.js process on `127.0.0.1:3000`
- Nginx proxies `/api/*` to the Node.js API
- direct external access to `/questionnaires/*` is blocked

The examples use `/var/www/psy-scale/current` as the application directory.
Adjust the domain, project path, and user for your server.

## 1. Prepare The Server

Install Nginx, Node.js, and npm. For this project, use a current Node.js LTS
version, for example Node.js 20 or newer.

For Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y nginx nodejs npm
```

Check versions:

```bash
node --version
npm --version
nginx -v
```

## 2. Upload The Project

Example directory layout:

```bash
sudo mkdir -p /var/www/psy-scale
sudo chown -R $USER:$USER /var/www/psy-scale
git clone <your-repo-url> /var/www/psy-scale/current
cd /var/www/psy-scale/current
```

Install dependencies and build the frontend:

```bash
npm ci
npm run build
```

During `npm run build`, questionnaire JSON files are copied from
`src/questionnaires` to `public/questionnaires`, then emitted by Vite to
`dist/questionnaires`.

After the build, the static frontend files should be here:

```text
/var/www/psy-scale/current/dist
```

## 3. Run The API With systemd

Create the service file:

```bash
sudo nano /etc/systemd/system/psy-scale-api.service
```

Use this config:

```ini
[Unit]
Description=Psy Scale questionnaire API
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/psy-scale/current
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3000
Environment=QUESTIONNAIRES_DIR=/var/www/psy-scale/current/dist/questionnaires
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

If `npm` is not located at `/usr/bin/npm`, check the path with:

```bash
which npm
```

Make sure `www-data` can read the project files:

```bash
sudo chown -R www-data:www-data /var/www/psy-scale/current
```

Start the API:

```bash
sudo systemctl daemon-reload
sudo systemctl enable psy-scale-api
sudo systemctl start psy-scale-api
sudo systemctl status psy-scale-api
```

Check the API locally on the server:

```bash
curl http://127.0.0.1:3000/api/questionnaires
curl http://127.0.0.1:3000/questionnaires/atq-30_en.json
```

## 4. Configure Nginx

Create the Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/psy-scale
```

Use this template:

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    root /var/www/psy-scale/current/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /questionnaires/ {
        return 404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Replace `example.com www.example.com` with your real domain.

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/psy-scale /etc/nginx/sites-enabled/psy-scale
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Verify The Deployment

Open these URLs in a browser:

```text
http://example.com/
http://example.com/api/questionnaires
```

Or test from the server:

```bash
curl -I http://127.0.0.1/
curl http://127.0.0.1/api/questionnaires
curl -I http://127.0.0.1/questionnaires/atq-30_en.json
```

The last command should return `404` through Nginx. Raw questionnaire JSON is
still available locally to the Node.js process through
`127.0.0.1:3000/questionnaires/<file>.json`, but it is not exposed through the
public Nginx server.

## 6. Enable HTTPS

If the domain already points to the server, issue a certificate with Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

After issuing the certificate, check Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Update The App

One simple update flow:

```bash
cd /var/www/psy-scale/current
sudo git pull
sudo npm ci
sudo npm run build
sudo chown -R www-data:www-data /var/www/psy-scale/current
sudo systemctl restart psy-scale-api
sudo systemctl reload nginx
```

## Troubleshooting

API logs:

```bash
sudo journalctl -u psy-scale-api -f
```

Nginx logs:

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

If port `3000` is already in use, change `PORT` in
`/etc/systemd/system/psy-scale-api.service` and update the Nginx `proxy_pass`
value.

If `http://127.0.0.1:3000/api/questionnaires` works on the server but the
domain URL does not, check:

- the Nginx config is enabled in `sites-enabled`
- `sudo nginx -t` passes without errors
- the `psy-scale-api` service is running
- the firewall allows HTTP/HTTPS traffic

## Notes On JSON Visibility

With this config, direct requests to `https://example.com/questionnaires/*.json`
are blocked by Nginx. This is useful when the files should exist on the server
for local Node.js access but should not be served as public static assets.

This does not make data secret if the browser needs to load it. Any JSON
returned to the browser through an API can still be inspected by the user in
browser developer tools. For private questionnaires, add authentication and
authorization to the API before returning questionnaire contents.
