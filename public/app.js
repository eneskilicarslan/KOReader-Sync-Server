document.addEventListener('DOMContentLoaded', () => {
    fetchBooks();
    // Auto-refresh every 5 seconds to show new syncs quickly
    setInterval(fetchBooks, 5000);


    // Set up form handler
    const editForm = document.getElementById('edit-form');
    console.log('Edit form found:', editForm);
    if (editForm) {
        editForm.onsubmit = async function (e) {
            e.preventDefault();
            console.log('Form submitted!');
            const hash = document.getElementById("edit-doc-hash").value;
            const title = document.getElementById("edit-title").value;
            const author = document.getElementById("edit-author").value;
            const cover_url = document.getElementById("edit-cover").value;

            console.log('Sending data:', { hash, title, author, cover_url });

            try {
                const response = await fetch(`/api/books/${hash}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, authors: author, cover_url })
                });

                console.log('Response:', response.status);
                const data = await response.json();
                console.log('Response data:', data);

                if (response.ok) {
                    closeModal('edit-modal');
                    fetchBooks();
                } else {
                    alert('Failed to update book');
                }
            } catch (error) {
                console.error('Error updating book:', error);
                alert('Error updating book');
            }
        }
    }

});

async function fetchBooks() {
    const bookList = document.getElementById('book-list');
    try {
        const response = await fetch('/api/books');
        if (!response.ok) throw new Error('Failed to fetch');
        const books = await response.json();

        bookList.innerHTML = '';

        if (books.length === 0) {
            bookList.innerHTML = '<p class="loading">No synced books found yet.</p>';
            return;
        }

        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';

            const progress = (book.percentage * 100).toFixed(1);
            const date = new Date(book.last_synced).toLocaleString();
            const title = book.title || 'Unknown Title';
            const author = book.authors || 'Unknown Author';
            const coverUrl = book.cover_url || '';

            // Escape quotes for handlers
            const safeTitle = title.replace(/'/g, "\\'");
            const safeAuthor = author.replace(/'/g, "\\'");
            const safeCover = coverUrl.replace(/'/g, "\\'");

            let coverHtml = '';
            if (coverUrl) {
                coverHtml = `<div class="book-cover" style="background-image: url('${coverUrl}')"></div>`;
            } else {
                coverHtml = `<div class="book-cover placeholder"><span>No Cover</span></div>`;
            }

            card.innerHTML = `
                ${coverHtml}
                <div class="book-info">
                    <div class="book-title">${title}</div>
                    <div class="book-author">${author}</div>
                    <div class="book-meta">
                        <div>Device: ${book.device}</div>
                        <div>Synced: ${date}</div>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">${progress}%</div>
                <div class="card-actions">
                    <button class="btn-icon btn-edit" onclick="openEditModal('${book.document_hash}', '${safeTitle}', '${safeAuthor}', '${safeCover}')">Edit</button>
                    <button class="btn-icon btn-debug" onclick="debugSync('${book.document_hash}')">Debug</button>
                    <button class="btn-icon btn-delete" onclick="deleteBook('${book.document_hash}')">Delete</button>
                </div>
            `;

            bookList.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        bookList.innerHTML = `<p class="loading" style="color: #cf6679;">Error loading books: ${error.message}</p>`;
    }
}

// --- Modal Logic ---
function openModal(id) {
    document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

// --- Edit Book ---
function openEditModal(hash, title, author, cover) {
    document.getElementById("edit-doc-hash").value = hash;
    document.getElementById("edit-title").value = title === 'Unknown Title' ? '' : title;
    document.getElementById("edit-author").value = author === 'Unknown Author' ? '' : author;
    document.getElementById("edit-cover").value = cover;
    openModal('edit-modal');
}

// --- Delete Book ---
async function deleteBook(hash) {
    if (!confirm('Are you sure you want to delete this book? This cannot be undone.')) return;

    try {
        const response = await fetch(`/api/books/${hash}`, { method: 'DELETE' });
        if (response.ok) {
            fetchBooks();
        } else {
            alert('Failed to delete book');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
    }
}

// --- Device Manager ---
function openDeviceModal() {
    openModal('device-modal');
}

async function renameDevice() {
    const oldName = document.getElementById('device-old').value;
    const newName = document.getElementById('device-new').value;

    if (!oldName || !newName) {
        alert('Please enter both old and new device names');
        return;
    }

    try {
        const response = await fetch('/api/devices/rename', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_name: oldName, new_name: newName })
        });

        if (response.ok) {
            closeModal('device-modal');
            fetchBooks();
            alert('Device renamed successfully');
        } else {
            alert('Failed to rename device');
        }
    } catch (error) {
        console.error('Error renaming device:', error);
    }
}

// --- Debug Sync ---
async function debugSync(hash) {
    try {
        const response = await fetch(`/api/debug/fetch/${hash}`);
        const data = await response.json();
        document.getElementById('debug-content').textContent = JSON.stringify(data, null, 2);
        openModal('debug-modal');
    } catch (error) {
        alert('Error fetching debug info');
    }
}

// Expose global functions
window.openEditModal = openEditModal;
window.deleteBook = deleteBook;
window.debugSync = debugSync;
window.openDeviceModal = openDeviceModal;
window.renameDevice = renameDevice;
window.closeModal = closeModal;
