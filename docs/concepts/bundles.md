---
id: concepts-bundles
slug: /concepts/bundles
title: Bundles
sidebar_label: Bundles
---

Bundles are the basic building blocks of infrastructure, applications, and architectures in Massdriver. They are composed of Terraform modules and Helm charts.

Massdriver includes a number of pre-built [best-practices and reference architecture bundles](https://github.com/massdriver-cloud), but you may also [develop your own](/bundles).

A Massdriver bundle typically serves a single purpose rather than abstracting an entire cloud service. Instead of terraform modules like "AWS RDS" they will typically be designed around the use case a software engineering is looking for like "AWS RDS MySQL". In Massdriver, we advise against bundles like 'S3 Bundle' and instead suggest bundles like 'S3 Logging Bucket' or 'CDN' (using S3 & Cloudfront).
