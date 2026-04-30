# WhatsApp Cloud API Setup Guide

This document outlines the steps required to get your WhatsApp Cloud API credentials and expose your local environment for webhooks.

## 1. Meta Developer App Setup
1. Go to the [Meta for Developers](https://developers.facebook.com/) portal.
2. Click **My Apps** -> **Create App**.
3. Select **Other** -> **Business**.
4. Give your app a name and click **Create App**.
5. In the App Dashboard, scroll down to **WhatsApp** and click **Set up**.
6. Select or create a **Meta Business Account**.

## 2. Get Credentials
Once set up, go to **WhatsApp** -> **API Setup** in the left sidebar:
- **Temporary Access Token**: Copy this (valid for 24 hours). For production, you'll need a Permanent Token.
- **Phone Number ID**: Copy this.
- **WhatsApp Business Account ID**: Copy this.

## 3. Configure Webhook
Go to **WhatsApp** -> **Configuration**:
1. **Callback URL**: This will be your Cloudflare Tunnel URL + `/api/webhook/whatsapp`.
2. **Verify Token**: Create a random string (e.g., `my_secret_token_123`) and save it.
3. **Webhook Fields**: Click **Manage** and subscribe to `messages`.

## 4. Expose Local Server (Cloudflare Tunnel)
If you don't have `cloudflared` installed:
```bash
# Ubuntu/Debian
sudo apt-get install cloudflared
```

To start a tunnel for your backend (default port 5000):
```bash
cloudflared tunnel --url http://localhost:5000
```
Copy the generated `.trycloudflare.com` URL and use it in the Meta Webhook configuration.
