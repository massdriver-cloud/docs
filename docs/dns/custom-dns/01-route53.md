---
id: platform-custom-dns-route53
slug: /dns/custom-dns/route53
title: AWS Route 53
sidebar_label: AWS Route 53
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

## Add nameservers in Route53
1. Log into [AWS Console](https://aws.amazon.com/console/)
2. Navigate to **Services** -> **Network & Content Deliver** -> **Route 53** -> **Registered Domains** -> **Your domain**
3. Click on **Add or edit name servers**
4. Add the nameservers from the previous step
5. Test your DNS configuration (it may take a few minutes to propagate):
```bash
nslookup -type=SOA yourdomain.com 8.8.8.8
nslookup -type=NS yourdomain.com 8.8.8.8
```

### Remove nameservers in Route53
1. Log into [AWS Console](https://aws.amazon.com/console/)
2. Navigate to **Services** -> **Network & Content Deliver** -> **Route 53** -> **Registered Domains** -> **Your domain**
3. Click on **Add or edit name servers**
4. Remove the nameservers from the previous step
