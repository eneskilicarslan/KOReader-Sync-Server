# TODO

## Future Enhancements

### EPUB Parsing for Manual Progress Updates
**Priority**: Low  
**Status**: Deferred

Currently, manual percentage updates from the WebAdmin UI don't sync to Kindle devices because we can't calculate the correct `progress_hash` (book location) without parsing the EPUB file.

**What's needed:**
1. Add EPUB file upload/storage to the server
2. Parse EPUB structure to map percentages to exact locations (XPath/CFI)
3. Calculate correct `progress_hash` for any given percentage
4. Update the database with the correct location data

**Benefits:**
- Allow admins to manually set reading progress from the web UI
- Enable "jump to percentage" feature
- Support progress migration between different editions of the same book

**Implementation notes:**
- Use `epub.js` or similar library for EPUB parsing
- Store EPUB files securely (consider storage limits)
- Cache location mappings for performance
- Handle different EPUB versions (2.0, 3.0, 3.1)

---

## Completed Features
- ✅ User authentication (registration, login)
- ✅ Progress sync (push from Kindle, pull to Kindle)
- ✅ Web dashboard with book list
- ✅ Metadata editing (title, author, cover URL)
- ✅ Device renaming
- ✅ Debug sync info viewer
- ✅ Docker containerization
- ✅ Metadata preservation across syncs
