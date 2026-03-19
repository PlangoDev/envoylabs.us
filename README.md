# EnvoyLabs

Next-generation platform with real-time capabilities, built on Google Cloud Platform.

## Architecture

- **Frontend**: Next.js 15 (React 19)
- **API**: Node.js + Express
- **Real-time**: Socket.io + Redis Pub/Sub
- **Database**: PostgreSQL 16
- **Storage**: Google Cloud Storage (1TB)
- **Infrastructure**: GCP Compute Engine (e2-standard-2)

## Quick Start

### 1. Setup Environment Variables

```bash
# Copy example env files
cp .env.example .env
cp frontend/.env.example frontend/.env
cp api/.env.example api/.env
cp realtime/.env.example realtime/.env

# Edit .env files with your actual values
```

### 2. Start Services Locally

```bash
docker-compose up -d
```

### 3. Deploy to Production

```bash
./deploy.sh
```

## Infrastructure Details

### Server Specs
- **Type**: e2-standard-2
- **vCPU**: 2
- **RAM**: 8GB
- **Disk**: 100GB SSD
- **Storage**: 1TB Cloud Storage
- **IP**: 34.55.127.234

### Domains
- **Website**: https://envoylabs.us
- **API**: https://api.envoylabs.us/v1
- **Real-time**: wss://api.envoylabs.us/realtime

## DNS Configuration

Add these records to your domain registrar:

```
Type    Name    Value               TTL
A       @       34.55.127.234       300
A       www     34.55.127.234       300
A       api     34.55.127.234       300
```

## API Endpoints

- `GET /v1` - API info
- `GET /health` - Health check
- `GET /v1/items` - Get items
- `POST /v1/items` - Create item

## Real-time Events

Connect to `wss://api.envoylabs.us/realtime`

Events:
- `join` - Join a room
- `leave` - Leave a room
- `message` - Send message
- `notification` - Send notification
- `presence` - User presence updates

## Development

```bash
# API
cd api && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Real-time
cd realtime && npm install && npm run dev
```

## Environment Variables

See `.env.example` files in each directory for required variables.

## Deployment

The `deploy.sh` script handles:
- Building Docker images
- Copying files to GCP instance
- Starting services
- Getting SSL certificates

## Monitoring

- PostgreSQL: Port 5432
- Redis: Port 6379
- Frontend: Port 3000
- API: Port 4000
- Real-time: Port 4001

## Security

- Rate limiting enabled (10 req/s for API)
- CORS configured
- Helmet.js security headers
- SSL/TLS certificates (Let's Encrypt)

## Budget

Monthly cost: ~$73
- e2-standard-2: $49/mo
- 100GB SSD: $17/mo
- 1TB Cloud Storage: $20/mo (first TB)
- Static IP: Free
- SSL: Free (Let's Encrypt)

## Support

For issues, check logs:
```bash
docker-compose logs -f [service-name]
```

## License

MIT
