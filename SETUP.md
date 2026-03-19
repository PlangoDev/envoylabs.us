# EnvoyLabs Setup Instructions

## ✅ Infrastructure Created

- **GCP Project**: envoylabs
- **Instance**: envoy-production (e2-standard-2)
- **Static IP**: 34.55.127.234
- **Storage Bucket**: envoylabs-media (1TB)
- **GitHub Repo**: https://github.com/PlangoDev/envoylabs.us

## 🌐 DNS Configuration Required

Go to your domain registrar (where you bought envoylabs.us) and add these DNS records:

```
Type    Name    Value               TTL
A       @       34.55.127.234       300
A       www     34.55.127.234       300
A       api     34.55.127.234       300
```

Wait 5-10 minutes for DNS to propagate. Check with:
```bash
dig envoylabs.us
dig api.envoylabs.us
```

## 🚀 Deploy to Production

Once DNS is configured:

```bash
cd ~/envoylabs.us
./deploy.sh
```

This will:
1. Copy all files to GCP instance
2. Build Docker containers
3. Start all services
4. Get SSL certificates from Let's Encrypt
5. Configure Nginx

## 🔐 Update Production Secrets

**IMPORTANT**: Before deploying, update these in `.env`:

```bash
# Generate secure secrets:
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for SESSION_SECRET
openssl rand -hex 32  # Use for POSTGRES_PASSWORD
```

Edit `.env` and replace test values with the generated secrets.

## 🧪 Test Services

After deployment, test each service:

```bash
# API Health Check
curl https://api.envoylabs.us/health

# API Endpoint
curl https://api.envoylabs.us/v1

# Real-time WebSocket
# Use browser console:
const socket = io('https://api.envoylabs.us/realtime')
socket.on('connect', () => console.log('Connected!'))
```

## 📊 Monitoring

SSH into the instance:
```bash
gcloud compute ssh envoy-production --zone=us-central1-a --project=envoylabs
```

Check services:
```bash
cd ~/envoylabs
docker-compose ps
docker-compose logs -f api
docker-compose logs -f realtime
```

## 🔄 Future Deployments

After making changes locally:

```bash
git add .
git commit -m "Your changes"
git push origin main
./deploy.sh
```

## 💰 Monthly Cost Breakdown

- e2-standard-2: $49/mo
- 100GB SSD: $17/mo
- 1TB Cloud Storage: $20/mo
- **Total**: ~$73/mo

## 📝 Next Steps

1. Configure DNS records ⬆️
2. Update production secrets
3. Run `./deploy.sh`
4. Build your frontend in `frontend/src/`
5. Add API endpoints in `api/src/routes/`
6. Customize real-time events in `realtime/src/`

## 🛠️ Development

Work locally:

```bash
# Frontend
cd frontend && npm install && npm run dev

# API
cd api && npm install && npm run dev

# Real-time
cd realtime && npm install && npm run dev
```

Access at:
- Frontend: http://localhost:3000
- API: http://localhost:4000/v1
- Real-time: http://localhost:4001
