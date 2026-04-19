# SmartVenue Lite ⚡

A lightweight, efficient, and production-ready web application designed to improve the physical event experience for attendees at large-scale sporting venues. Built to optimize crowd movements, reduce wait times, and offer an intelligent mapping system, all within a repository size incredibly well under 10MB limit.

## Features
- **Intelligent Route Suggestion**: Generates the least crowded paths between gates, food stalls, and seats.
- **Real-Time Data Visualization**: Intuitive venue map with color-coded crowds and legends.
- **Offline & Low-Network Resiliency**: Progressive Web App (PWA) with Service Worker caching ensuring graceful degradation.
- **Admin & Demo Mode**: Manual control interfaces alongside an optional hybrid auto-randomization system to observe live updates naturally without constant manual inputs.
- **High-Performance Architecture**: Vanilla HTML/JS frontend powered by a lightweight Express.js backend. Entirely stateless with in-memory store.

## Local Setup & Testing

### Prerequisites
- Node.js (v18+)
- Docker (optional)

### Running Locally
1. Clone the repository and navigate inside:
   ```bash
   git clone https://github.com/animesh-bhanarkar/gcp-promptwars.git
   cd gcp-promptwars
   ```
2. Install minimal dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Access the App: Keep your browser pointed to `http://localhost:8080`.
   Access the Admin Panel: Navigate to `http://localhost:8080/admin.html`.

### Docker Setup
1. Build the image:
   ```bash
   docker build -t smartvenue-lite .
   ```
2. Run the container:
   ```bash
   docker run -p 8080:8080 smartvenue-lite
   ```

## Cloud Run Deployment

This application is structurally prepared for Google Cloud Run directly from source or via containerization.

```bash
gcloud run deploy smartvenue-lite --source . --platform managed --allow-unauthenticated
```
Make sure caching and port `8080` are recognized during deployment.