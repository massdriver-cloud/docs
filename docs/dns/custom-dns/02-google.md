---
id: platform-custom-dns-google
slug: /dns/custom-dns/google
title: Google Domains
sidebar_label: Google Domains
---

## Get cloud DNS nameservers:
### AWS
1. Log into [AWS Console](https://aws.amazon.com/console/)
2. Navigate to **Services** -> **Network & Content Deliver** -> **Route 53** -> **Hosted Zones**
3. Select your domain
4. Copy the **NS** records for your domain

### Azure
1. Log into [Azure Portal](https://portal.azure.com/)
2. Navigate to **All Services** -> **Networking** -> **DNS Zones**
3. Select your domain
4. Copy the **Name server** records

### GCP
1. Log into [GCP Console](https://console.cloud.google.com/)
2. Navigate to **Network services** -> **Cloud DNS**
3. Select your domain
4. Select the **NS** domain record
5. Copy the name servers in **Data**

## Add nameservers in Google Domains
1. Log into [Google Domains](https://domains.google.com/)
2. For your domain, click **Manage**
3. Navigate to **DNS**
4. Click **Custom name servers**
5. Add your nameservers
6. Then click **Switch to these settings**. **Custom name servers** will show as **Active**
7. Test your DNS configuration (it may take a few minutes to propagate):
```bash
nslookup -type=SOA yourdomain.com 8.8.8.8
nslookup -type=NS yourdomain.com 8.8.8.8
```

### Remove nameservers in Google Domains
1. Log into [Google Domains](https://domains.google.com/)
2. For your domain, click **Manage**
3. Navigate to **DNS**
4. Under **Default name servers**, click **Switch to these settings**
5. Click **Custom name servers** -> **Manage name servers**
6. Remove each entry and click **Save**
