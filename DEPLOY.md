# Deployment Guide — Hostinger VPS + Cloudflare + Caddy

This guide walks you through deploying the inventory manager SPA to a
Hostinger VPS (Ubuntu 24.04) with Cloudflare DNS proxy and Caddy as a
reverse proxy.

## Table of Contents
1. Prerequisites
2. Domain and Cloudflare Setup
3. Nameserver Change at Registro.br
4. Initial VPS Hardening
5. Hostinger Panel Firewall
6. Install Docker
7. Configure GitHub Deploy Key
8. First Deploy
9. Subsequent Deploys
10. Monitoring
11. Backups and Recovery
12. Troubleshooting
13. Security Checklist

---

## 1. Prerequisites

- Hostinger VPS (Ubuntu 24.04) with public IPv4 (and optionally IPv6)
- `.com.br` domain registered (any registrar; this guide assumes Registro.br)
- Cloudflare account (free tier is sufficient)
- An SSH key pair on your local machine
- Initial root password (emailed by Hostinger)

## 2. Domain and Cloudflare Setup

1. Sign up at https://dash.cloudflare.com/sign-up (free).
2. Click "Add a Site" → enter `yourdomain.com.br` → select "Free" plan.
3. Cloudflare scans existing DNS records. Review and add:
   - **A** record: Name `@`, Value `<VPS_IPV4>`, Proxy status **Proxied** (orange cloud)
   - **A** record: Name `www`, Value `<VPS_IPV4>`, Proxy status **Proxied** (orange cloud)
   - **AAAA** record: Name `@`, Value `<VPS_IPV6>`, Proxy status **Proxied** (only if your VPS has IPv6)
   - **AAAA** record: Name `www`, Value `<VPS_IPV6>`, Proxy status **Proxied** (only if your VPS has IPv6)
4. Cloudflare assigns you two nameservers (e.g., `anna.ns.cloudflare.com`).
   Note them for step 3.
5. In Cloudflare dashboard, go to **SSL/TLS**:
   - Encryption mode: **Full** (Caddy has its own valid cert)
   - Edge Certificates → Always Use HTTPS: **On**
   - Minimum TLS Version: **1.2** (or 1.3)
6. (Optional) **Security** → Bot Fight Mode: **On**
7. (Optional) **Security** → WAF: enable Cloudflare Managed Rules

## 3. Nameserver Change at Registro.br

1. Log in at https://registro.br (the `.com.br` registry).
2. Go to the domain's administration panel.
3. Change DNS from "Registro.br" to "Externo" (external).
4. Enter the two Cloudflare nameservers from step 2.4.
5. Save. Propagation can take 2–24 hours.
6. Verify: `dig NS yourdomain.com.br` should return Cloudflare's nameservers.

## 4. Initial VPS Hardening

SSH in as root: `ssh root@<VPS_IP>`

```bash
# Update system
apt update && apt upgrade -y

# Create non-root user
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
# Paste your public key into /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Disable root SSH and password auth
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# Firewall
ufw default deny incoming
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status

# fail2ban
apt install -y fail2ban
systemctl enable --now fail2ban

# Automatic security updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades   # select "Yes"
```

Reboot: `reboot`. Then SSH back as `deploy@<VPS_IP>`.

## 5. Hostinger Panel Firewall

In hPanel → VPS → Firewall, add rules mirroring `ufw`:
- Allow TCP 22 (SSH)
- Allow TCP 80 (HTTP)
- Allow TCP 443 (HTTPS)

## 6. Install Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deploy
```

Log out and back in for the `docker` group to take effect.

Verify: `docker compose version` should print a version ≥ 2.x.

## 7. Configure GitHub Deploy Key

Generate the key pair on your local machine (or any secure location):

```bash
ssh-keygen -t ed25519 -C "hostinger-vps-deploy" -f ~/hostinger_vps_deploy
# Press Enter twice to skip passphrase (acceptable for a deploy key)
```

On GitHub, go to your private repo → **Settings** → **Deploy keys** → **Add deploy key**:
- Title: `Hostinger VPS`
- Key: paste contents of `~/hostinger_vps_deploy.pub`
- ✅ Check **Allow write access** is OFF (read-only)

On the VPS, copy the private key:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Paste contents of ~/hostinger_vps_deploy into ~/.ssh/hostinger_vps_deploy
chmod 600 ~/.ssh/hostinger_vps_deploy

cat >> ~/.ssh/config <<'EOF'
Host github.com
    IdentityFile ~/.ssh/hostinger_vps_deploy
    IdentitiesOnly yes
    User git
EOF
chmod 600 ~/.ssh/config
```

Test: `ssh -T git@github.com` → expect "Hi <user>/<repo>! You've been granted access."

## 8. First Deploy

```bash
cd ~
git clone git@github.com:<owner>/inventory-manager-spa.git
cd inventory-manager-spa

# Create .env with your real email
cp .env.example .env
nano .env   # set CADDY_EMAIL=you@yourdomain.com.br
chmod 600 .env

# Edit Caddyfile to replace the placeholder domain with your real one:
#   sed -i 's/yourdomain.com.br/<your-real-domain>.com.br/g' Caddyfile
# Or open it in your editor of choice.

# Build and start
docker compose up -d --build
docker compose ps
docker compose logs caddy
```

In the Caddy logs, you should see:
- Caddy starting
- ACME challenge succeeding (Let's Encrypt cert issued)
- HTTPS serving on port 443

Verify from your local machine:
- `https://yourdomain.com.br/` — should load with a valid cert
- `https://securityheaders.com/?q=https://yourdomain.com.br` — should show A or A+ rating

## 9. Subsequent Deploys

```bash
cd ~/inventory-manager-spa
yarn deploy   # git pull + docker compose up -d --build + prune old images
```

Or manually:
```bash
git pull
docker compose up -d --build
docker image prune -f
```

## 10. Monitoring

- **UptimeRobot** (free): create an HTTPS monitor at `https://yourdomain.com.br/`, check every 5 minutes, alert via email.
- **Logs**:
  - `docker compose logs -f` (both services)
  - `docker compose logs -f caddy` (Caddy only)
  - `docker compose logs -f app` (app only)
- **Disk space**: `df -h` — alert if > 80% full
- **Container health**: `docker compose ps` — both should be `healthy`

## 11. Backups and Recovery

- **User data**: lives in users' browser `localStorage`. Not on the server. No backup needed.
- **Server config**: `compose.yaml`, `Caddyfile`, `.env` should be backed up.
  `compose.yaml` and `Caddyfile` are in git. `.env` is not — store it somewhere safe
  (password manager, encrypted backup) so you can restore it.
- **Caddy certificates**: persist in the `caddy_data` Docker volume.
  Survives `docker compose restart`. Lost only if you wipe the volume.
- **Full VPS rebuild**: clone repo, recreate `.env`, `docker compose up -d --build`.
  The first start will re-request Let's Encrypt certs automatically.

## 12. Troubleshooting

### DNS not propagating
```bash
dig NS yourdomain.com.br
dig A yourdomain.com.br
dig A www.yourdomain.com.br
```

If Cloudflare nameservers don't appear, wait longer (up to 24h) and re-check.

### Cert not issued
```bash
docker compose logs caddy | grep -i acme
```
- Ensure port 80 is reachable from the internet (`curl http://<VPS_IP>` from another host)
- Ensure `CADDY_EMAIL` is set in `.env`
- Check Cloudflare DNS records: A record for `@` and `www` must point to VPS IP

### 502 Bad Gateway
The Caddy proxy can't reach the app. Check:
```bash
docker compose ps app    # should be "healthy"
docker compose logs app  # look for crashes
```

### Container restarting in a loop
```bash
docker compose ps
docker compose logs --tail=50 <service>
```

### Hostinger blocked traffic
Check hPanel → VPS → Firewall. Ensure 80 and 443 are allowed.

### Out of disk space
```bash
docker system df
docker system prune -a   # WARNING: removes all unused images
```

## 13. Security Checklist

After first deploy, verify each item:

- [ ] SSH key-only auth (password auth disabled)
- [ ] Root SSH disabled
- [ ] `ufw` active with only 22, 80, 443 open
- [ ] Hostinger panel firewall mirrors `ufw`
- [ ] fail2ban running
- [ ] unattended-upgrades enabled
- [ ] HTTPS works (browser shows padlock)
- [ ] HSTS header present (check `curl -I https://yourdomain.com.br`)
- [ ] CSP header present
- [ ] Cloudflare proxy is orange cloud (hides VPS IP)
- [ ] `.env` on VPS has `chmod 600`
- [ ] GitHub deploy key is read-only
- [ ] No `.env` ever committed to git (`git log --all --full-history -- .env` should be empty)
