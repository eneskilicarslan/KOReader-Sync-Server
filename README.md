
## Deployment

### Prerequisites
- Docker and Docker Compose

### Steps
1.  Clone or copy this repository to your server.
2.  Run the server:
    ```bash
    docker-compose up -d
    ```
3.  The server will be available at `http://<your-server-ip>:3000`.

## KOReader Configuration

To use this server with your KOReader device (Kindle, Kobo, Android, etc.):

1.  **Open KOReader** on your device.
2.  Tap the top menu to open the toolbar.
3.  Go to **Network** (the wifi icon) -> **Progress sync**.
4.  Tap **Server URL**.
    - Enter: `http://<your-server-ip>:3000`
    - *Replace `<your-server-ip>` with the IP address of the machine running this server.*
5.  Tap **Login / Register**.
    - **Username**: Choose a username.
    - **Password**: Choose a password.
    - Tap **Register** to create a new account.
    - Or tap **Login** if you already created one.
6.  **Enable Sync**:
    - Ensure "Progress sync" is checked in the menu.
    - Open a book, and it should now sync your progress!

## Web Dashboard

Visit `http://<your-server-ip>:3000` in your web browser to see a list of all the books you are reading and your current progress.
