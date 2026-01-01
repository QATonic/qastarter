# Deploying QAStarter to Hostinger VPS with Easypanel

This guide explains how to deploy QAStarter to a Hostinger VPS using Easypanel, complete with CI/CD automation.

## prerequisites

1.  **Hostinger VPS** running Ubuntu 22.04 or later.
2.  **Domain Name** (`qastarter.qatonic.com`) pointed to your VPS IP.
3.  **GitHub Repository** with your QAStarter code.

## Step 1: Install Easypanel on Hostinger VPS

1.  SSH into your VPS:
    ```bash
    ssh root@YOUR_VPS_IP
    ```
2.  Run the Easypanel installation script:
    ```bash
    curl -sSL https://get.easypanel.io | sh
    ```
3.  Once installed, open your browser and go to `http://YOUR_VPS_IP:3000`.
4.  Create your admin account.

## Step 2: Create Project in Easypanel

1.  Click **Create Project** and name it `QAStarter`.
2.  Inside the project, click **+ Service** -> **App**.
3.  Select **GitHub** as the source.
4.  Configure the service:
    *   **Repository User/Org**: `QATonic`
    *   **Repository Name**: `QAStarter`
    *   **Branch**: `main`
    *   **Build Type**: `Dockerfile`
    *   **Port**: `5000` (Important! Check your Dockerfile EXPOSE port)

## Step 3: Configure Environment Variables

In the **Environment** tab of your service, add the following secrets:

```env
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://qastarter.qatonic.com
```

## Step 4: Configure Domain

1.  Go to the **Domains** tab.
2.  Add your domain: `qastarter.qatonic.com`.
3.  Enable **HTTPS** (Easypanel handles SSL automatically).

## Step 5: Setup Automatic Deployments (CI/CD)

To auto-deploy when you push to GitHub:

1.  In Easypanel, go to your service's **Deploy** tab (or Settings).
2.  Find the **Deploy Webhook URL**. It looks like:
    `https://YOUR_PANEL_DOMAIN/api/webhooks/deploy/UUID`
3.  Copy this URL.

### GitHub Actions Setup

1.  Go to your GitHub Repo -> **Settings** -> **Secrets and variables** -> **Actions**.
2.  Create a new Repository Secret:
    *   **Name**: `EASYPANEL_WEBHOOK_URL`
    *   **Value**: (Paste the webhook URL you copied)
3.  The `ci.yml` in this repository is already configured to trigger this webhook after successful tests!

```yaml
  # Auto-deploy to Easypanel
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [docker] # Only deploy if Docker build passes
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Trigger Easypanel Deploy
        run: curl -X POST ${{ secrets.EASYPANEL_WEBHOOK_URL }}
```

## Troubleshooting

- **Logs**: Check the "Logs" tab in Easypanel to see build/runtime errors.
- **Health Check**: Ensure `/api/v1/metadata` is returning 200 OK.
- **Ports**: Verify Dockerfile exposes port 5000.
