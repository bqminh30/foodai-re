# Docker Setup for Food Recommendation System

This document provides instructions for running the application using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

The easiest way to run the application is with Docker Compose:

```bash
# Build and start the application and Redis
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The application will be available at http://localhost:3000

## Environment Variables

Environment variables are loaded from the `.env` file. For production, copy and rename `.env.production` to `.env` and update the values:

```bash
cp .env.production .env
# Edit .env with your actual API keys and settings
```

### Redis Configuration

The application uses Redis for caching. You can configure Redis using these environment variables:

```
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=your_redis_password_here
REDIS_DB=0
```

Alternatively, you can provide a complete connection URL:

```
REDIS_URL=redis://username:password@hostname:port
```

## Building the Docker Image Manually

If you prefer to build and run the Docker image without Docker Compose:

```bash
# Build the image
docker build -t food-recommendation-app .

# Run the container
docker run -p 3000:3000 --env-file .env food-recommendation-app
```

## Development with Docker

For development, you can:

1. Uncomment the volume mounts in `docker-compose.yml` to enable hot reloading
2. Set `NODE_ENV=development` in the environment section

```bash
# Run in development mode with hot reloading and Redis
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Production Deployment

For production deployment:

1. Ensure all API keys are set in your `.env` file
2. Update `NEXT_PUBLIC_API_URL` to your production domain
3. Set `NEXT_PUBLIC_RECAPTCHA_ENABLED=true` for enhanced security
4. Configure Redis password and security settings

## Redis Persistence

Redis data is persisted using volumes. If you need to clear the cache, you can remove the volume:

```bash
docker-compose down
docker volume rm rcmsys_redis-data
docker-compose up -d
```

## Troubleshooting

If you encounter issues:

1. Check the container logs: `docker-compose logs -f`
2. Verify the environment variables are properly set in your `.env` file
3. Make sure Redis is accessible by the application: `docker-compose exec app ping redis`
4. For clean rebuilds: `docker-compose down && docker-compose build --no-cache && docker-compose up -d` 