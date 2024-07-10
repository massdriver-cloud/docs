---
id: platform-custom-dns-godaddy
slug: /dns/custom-dns/godaddy
title: GoDaddy
sidebar_label: GoDaddy
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

## Add nameservers in GoDaddy
1. Sign into your [GoDaddy account](https://dcc.godaddy.com/control/portfolio)
2. Select the checkbox next to the domain you want to update
3. Select **Nameservers** from the menu (might need to select **More** and scroll down to **Nameservers**)
4. Select **I'll use my own nameservers** and enter the nameservers from the previous step
5. Click **Save**
6. Test your DNS configuration (it may take a few minutes to propagate):
```bash
nslookup -type=SOA yourdomain.com 8.8.8.8
nslookup -type=NS yourdomain.com 8.8.8.8
```

### Remove nameservers in GoDaddy
1. Sign into your [GoDaddy account](https://dcc.godaddy.com/control/portfolio)
2. Select the checkbox next to the domain you want to update
3. Select **Nameservers** from the menu (might need to select **More** and scroll down to **Nameservers**)
4. Select **GoDaddy Nameservers** and click **Save**
