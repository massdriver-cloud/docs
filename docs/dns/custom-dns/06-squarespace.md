---
id: platform-custom-dns-squarespace
slug: /dns/custom-dns/squarespace
title: Squarespace
sidebar_label: Squarespace
---

## Get cloud DNS nameservers:
### AWS
1. Log into [AWS Console](https://aws.amazon.com/console/)
2. Navigate to **Services** -> **Network & Content Deliver** -> **Route 53** -> **Hosted Zones**
3. Select your domain
4. 4. Add the following A records to AWS DNS:
   1. `198.185.159.144`
   2. `198.185.159.145`
   3. `198.49.23.144`
   4. `198.49.23.145`
5. Add this CNAME record to AWS DNS: `ext-sq.squarespace.com`
5. Copy the **NS** records for your domain

### Azure
1. Log into [Azure Portal](https://portal.azure.com/)
2. Navigate to **All Services** -> **Networking** -> **DNS Zones**
3. Select your domain
4. Add the following A records to Azure DNS:
   1. `198.185.159.144`
   2. `198.185.159.145`
   3. `198.49.23.144`
   4. `198.49.23.145`
5. Add this CNAME record to Azure DNS: `ext-sq.squarespace.com`
6. Copy the **Name server** records

### GCP
1. Log into [GCP Console](https://console.cloud.google.com/)
2. Navigate to **Network services** -> **Cloud DNS**
3. Select your domain
4. 4. Add the following A records to Google DNS:
   1. `198.185.159.144`
   2. `198.185.159.145`
   3. `198.49.23.144`
   4. `198.49.23.145`
5. Add this CNAME record to Google DNS: `ext-sq.squarespace.com`
5. Select the **NS** domain record
6. Copy the name servers in **Data**

## Add nameservers in Squarespace
1. Sign into your [Squarespace domains panel](https://account.squarespace.com/project-picker?client_id=helpcenter&redirect_url=%2Fsettings%2Fdomains)
2. Under **Squarespace domains**, click domain name you want to change
3. Click **Advanced settings** and click **Nameservers** tab
4. Select **Use custom nameservers** and add your cloud nameservers (remove any Squarespace nameservers listed)
5. Click **Save** in the top right corner
6. Test your DNS configuration (it may take a few minutes to propagate):
```bash
nslookup -type=SOA yourdomain.com 8.8.8.8
nslookup -type=NS yourdomain.com 8.8.8.8
```

### Remove nameservers in Squarespace
1. Sign into your [Squarespace domains panel](https://account.squarespace.com/project-picker?client_id=helpcenter&redirect_url=%2Fsettings%2Fdomains)
2. Under **Squarespace domains**, click domain name you want to change
3. Click **Advanced settings** and click **Nameservers** tab
4. Select **Use Squarespace Nameservers** and click **Save**
