# Deployment Configuration

Reference configs for server setup. Copy to the appropriate system paths on the server.

## Nginx

```bash
cp deployment/nginx.conf /etc/nginx/sites-available/pulse
ln -sf /etc/nginx/sites-available/pulse /etc/nginx/sites-enabled/pulse
rm -f /etc/nginx/sites-enabled/default
nginx -t && service nginx reload
```

## Queue Worker (systemd)

```bash
cp deployment/pulse-queue.service /etc/systemd/system/pulse-queue.service
systemctl daemon-reload
systemctl enable pulse-queue.service
systemctl start pulse-queue.service
```

## Permissions

```bash
chown -R www-data:www-data /opt/pulse/storage /opt/pulse/bootstrap/cache
chmod -R 775 /opt/pulse/storage /opt/pulse/bootstrap/cache
```
