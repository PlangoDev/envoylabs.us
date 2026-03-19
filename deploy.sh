#!/bin/bash
set -e

# Configuration
PROJECT_ID="envoylabs"
INSTANCE_NAME="envoy-production"
ZONE="us-central1-a"
STATIC_IP="34.55.127.234"

echo "🚀 Deploying EnvoyLabs to GCP..."

# Check if gcloud is configured
if ! gcloud config get-value project &>/dev/null; then
    echo "❌ gcloud not configured. Run: gcloud init"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual values and run again."
    exit 1
fi

# Build and copy files to instance
echo "📦 Copying files to GCP instance..."
gcloud compute scp --recurse \
    --zone=$ZONE \
    --project=$PROJECT_ID \
    . $INSTANCE_NAME:~/envoylabs \
    --exclude=".git" \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude="dist"

# SSH into instance and deploy
echo "🔧 Setting up on remote instance..."
gcloud compute ssh $INSTANCE_NAME \
    --zone=$ZONE \
    --project=$PROJECT_ID \
    --command="
        set -e
        cd ~/envoylabs

        # Stop existing containers
        docker-compose down 2>/dev/null || true

        # Start services
        docker-compose up -d --build

        # Wait for services to start
        echo '⏳ Waiting for services to start...'
        sleep 10

        # Get SSL certificates (first time only)
        if [ ! -f certbot/conf/live/envoylabs.us/fullchain.pem ]; then
            echo '🔐 Getting SSL certificates...'
            docker-compose run --rm certbot certonly --webroot \
                --webroot-path=/var/www/certbot \
                --email your@email.com \
                --agree-tos \
                --no-eff-email \
                -d envoylabs.us \
                -d www.envoylabs.us \
                -d api.envoylabs.us

            # Restart nginx to load certificates
            docker-compose restart nginx
        fi

        # Show status
        echo '✅ Deployment complete!'
        docker-compose ps
        echo ''
        echo '🌐 Your site should be live at:'
        echo '   https://envoylabs.us'
        echo '   https://api.envoylabs.us/v1'
        echo '   wss://api.envoylabs.us/realtime'
    "

echo "✅ Deployment complete!"
