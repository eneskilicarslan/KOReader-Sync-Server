# KOReader Sync Server

> **Vibecoded Project**: This entire project was created through AI-assisted development (vibecoding). No hard feelings if things break - it's all part of the vibe.

A self-hosted sync server for KOReader with a modern web dashboard for managing reading progress across devices.

## Features

- **Progress Sync**: Automatic sync between Kindle/Kobo and server
- **Web Dashboard**: Modern dark-themed UI for managing books
- **Metadata Editing**: Update title, author, and cover URLs
- **Device Management**: Rename devices across all synced books
- **Debug Tools**: Inspect raw sync data for troubleshooting
- **Docker Ready**: Easy deployment with Docker Compose
- **Secure**: User authentication with bcrypt password hashing

## Quick Start

### Prerequisites
- Docker and Docker Compose (recommended)
- OR Node.js 18+ (for bare metal deployment)

### Deployment

```bash
# Clone the repository
git clone https://github.com/eneskilicarslan/KOReader-Sync-Server.git
cd KOReader-Sync-Server

# Start with Docker
docker-compose up -d

# Or run directly with Node.js
npm install
node server.js
```

The server will be available at `http://YOUR_SERVER_IP:8742`

## KOReader Configuration

1. **Open KOReader** on your device
2. Go to **Settings** → **Network** → **Progress Sync**
3. Configure:
   - **Server URL**: `http://YOUR_SERVER_IP:8742`
   - **Username**: (create via web dashboard first)
   - **Password**: (your password)
4. **Enable** Progress Sync
5. Open a book and close it - it should sync!

## Web Dashboard

Visit `http://YOUR_SERVER_IP:8742` to:
- View all synced books with progress bars
- Edit book metadata (title, author, cover)
- Rename devices
- Debug sync issues
- Delete books from sync database

## Documentation

- [Walkthrough](walkthrough.md) - Complete feature guide
- [TODO](TODO.md) - Planned features
- [Contributing](CONTRIBUTING.md) - How to contribute

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Frontend**: Vanilla JavaScript, CSS
- **Deployment**: Docker, Docker Compose

## Known Limitations

- Manual percentage updates from web UI don't sync to Kindle (requires EPUB parsing - see TODO.md)
- Metadata editing works perfectly and persists across syncs

## License

MIT License - see [LICENSE](LICENSE) for details

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

**Made with vibecoding** - Keep the vibe positive!
