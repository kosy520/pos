# Deployment Guide

This guide covers deploying the POS/ERP system to production.

## Prerequisites

- Node.js 14+ installed on server
- Domain name (optional)
- SSL certificate (recommended for HTTPS)
- Process manager (PM2 recommended)

## Deployment Steps

### 1. Server Setup

#### Update System
```bash
sudo apt update
sudo apt upgrade -y
```

#### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Install PM2
```bash
sudo npm install -g pm2
```

### 2. Application Setup

#### Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/kosy520/pos.git
cd pos
```

#### Install Dependencies
```bash
npm install
cd client && npm install && cd ..
```

#### Build Frontend
```bash
cd client
npm run build
cd ..
```

### 3. Environment Configuration

#### Create Production .env
```bash
cat > .env << EOF
PORT=3001
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
EOF
```

#### Secure .env File
```bash
chmod 600 .env
```

### 4. Database Setup

The SQLite database will be created automatically on first run.

#### Set Proper Permissions
```bash
mkdir -p server
chmod 755 server
```

#### Backup Strategy
Create a backup script:
```bash
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/pos"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp server/database.sqlite $BACKUP_DIR/database_$DATE.sqlite
# Keep only last 30 backups
ls -t $BACKUP_DIR/database_*.sqlite | tail -n +31 | xargs -r rm
EOF

chmod +x backup-db.sh
```

#### Schedule Daily Backups
```bash
crontab -e
# Add this line:
0 2 * * * /var/www/pos/backup-db.sh
```

### 5. Start Application with PM2

#### Start Backend
```bash
pm2 start server/index.js --name pos-backend
pm2 save
pm2 startup
```

#### Serve Frontend (Option 1: Using serve)
```bash
npm install -g serve
pm2 start "serve -s client/build -l 3000" --name pos-frontend
pm2 save
```

#### Serve Frontend (Option 2: Using nginx - Recommended)
See Nginx section below.

### 6. Nginx Configuration (Recommended)

#### Install Nginx
```bash
sudo apt install -y nginx
```

#### Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/pos
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/pos/client/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/pos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL Setup with Let's Encrypt

#### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### Get SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

#### Auto-renewal
Certbot sets up auto-renewal automatically. Test it:
```bash
sudo certbot renew --dry-run
```

### 8. Firewall Configuration

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 9. Monitoring

#### Check Application Status
```bash
pm2 status
pm2 logs pos-backend
```

#### Monitor Resources
```bash
pm2 monit
```

#### Set up PM2 Web Dashboard
```bash
pm2 install pm2-server-monit
```

### 10. Security Hardening

#### Create Dedicated User
```bash
sudo useradd -r -s /bin/false pos
sudo chown -R pos:pos /var/www/pos
```

#### Run PM2 as Dedicated User
```bash
sudo su - pos
pm2 start server/index.js --name pos-backend
pm2 save
```

#### Disable Root SSH
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

#### Set up Fail2ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Environment Variables for Production

Recommended .env settings:

```env
PORT=3001
JWT_SECRET=<generate-secure-random-string>
NODE_ENV=production

# Optional: Database backup location
BACKUP_DIR=/var/backups/pos

# Optional: Log settings
LOG_LEVEL=info
```

## Updating the Application

```bash
cd /var/www/pos
git pull origin main
npm install
cd client && npm install && npm run build && cd ..
pm2 restart pos-backend
```

## Backup and Restore

### Manual Backup
```bash
./backup-db.sh
```

### Restore from Backup
```bash
cp /var/backups/pos/database_YYYYMMDD_HHMMSS.sqlite server/database.sqlite
pm2 restart pos-backend
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs pos-backend

# Check if port is in use
sudo lsof -i :3001

# Restart application
pm2 restart pos-backend
```

### Database Issues
```bash
# Check database file permissions
ls -l server/database.sqlite

# Verify database integrity
sqlite3 server/database.sqlite "PRAGMA integrity_check;"
```

### High Memory Usage
```bash
# Monitor memory
pm2 monit

# Restart if needed
pm2 restart pos-backend
```

## Performance Optimization

### Enable Compression in Nginx
Add to nginx config:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### PM2 Cluster Mode
For better performance with multiple CPU cores:
```bash
pm2 start server/index.js -i max --name pos-backend
```

### Database Optimization
```bash
# Vacuum database periodically
sqlite3 server/database.sqlite "VACUUM;"
```

## Monitoring and Logs

### View Logs
```bash
# Application logs
pm2 logs pos-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Log Rotation
PM2 handles log rotation automatically. Configure if needed:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## Disaster Recovery

### Full System Backup
```bash
#!/bin/bash
BACKUP_ROOT="/var/backups/pos-full"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_ROOT/$DATE
cp -r /var/www/pos $BACKUP_ROOT/$DATE/
cp /etc/nginx/sites-available/pos $BACKUP_ROOT/$DATE/nginx.conf
```

### Recovery Steps
1. Restore application files
2. Restore database
3. Restore nginx configuration
4. Restart services

## Support and Maintenance

- Regular updates: Weekly
- Security patches: As needed
- Database backups: Daily
- Log monitoring: Daily
- Performance review: Monthly

## Production Checklist

- [ ] JWT_SECRET is secure and random
- [ ] .env file has proper permissions (600)
- [ ] Database backups are automated
- [ ] SSL certificate is installed
- [ ] Firewall is configured
- [ ] Application runs on startup
- [ ] Nginx is properly configured
- [ ] Logs are being rotated
- [ ] Monitoring is set up
- [ ] Backup restoration tested

## Resources

- PM2 Documentation: https://pm2.keymetrics.io/
- Nginx Documentation: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
