# Contributing to KOReader Sync Server

Thanks for your interest in contributing! This project was vibecoded (AI-assisted development), so feel free to vibe with it. 🎵

## How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly** (especially sync functionality)
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## Development Setup

```bash
# Install dependencies
npm install

# Run locally
node server.js

# Or with Docker
docker-compose up
```

## Code Style

- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small
- Follow existing code patterns

## Testing

Before submitting a PR, please test:
- ✅ Kindle → Server sync (push)
- ✅ Server → Kindle sync (pull)
- ✅ Web dashboard functionality
- ✅ Metadata editing
- ✅ Device renaming

## Reporting Issues

When reporting bugs, please include:
- KOReader version
- Server environment (Docker/bare metal)
- Steps to reproduce
- Expected vs actual behavior
- Relevant log snippets

## Feature Requests

Check `TODO.md` for planned features. If you have a new idea, open an issue to discuss it first!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Remember**: This is a vibecoded project. Keep the vibe positive! ✨
