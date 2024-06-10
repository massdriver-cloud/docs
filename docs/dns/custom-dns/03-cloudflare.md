---
id: platform-custom-dns-cloudflare
slug: /dns/custom-dns/cloudflare
title: Cloudflare
sidebar_label: Cloudflare
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

## Add nameservers in Cloudflare
1. Create nameservers with [POST command](https://developers.cloudflare.com/api/operations/account-level-custom-nameservers-add-account-custom-nameserver)
2. Open a ticket with [Cloudflare support](https://support.cloudflare.com/hc/articles/200172476) to add glue records to your account nameservers and have your nameservers updated
3. Test your DNS configuration (it may take a few minutes to propagate):
```bash
nslookup -type=SOA yourdomain.com 8.8.8.8
nslookup -type=NS yourdomain.com 8.8.8.8
```

### Remove nameservers in Cloudflare
1. Remove nameservers with [PUT command](https://developers.cloudflare.com/api/operations/account-level-custom-nameservers-usage-for-a-zone-set-account-custom-nameserver-related-zone-metadata)
2. Set `"enabled": true` to `"enabled": false`
3. Open a ticket with [Cloudflare support](https://support.cloudflare.com/hc/articles/200172476) to remove glue records from your account nameservers and have your nameservers updated
