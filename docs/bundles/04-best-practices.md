---
id: bundles-best-practices
slug: /bundles/best-practices
title: Bundle Best Practices
sidebar_label: Best Practices
---

:::note
This page is a WIP.
:::


* Keep bundle scope small
* How does it look on a whiteboard?


## Using MD Metadata Name Prefix

## Bundle Naming Conventions

bundles: 
* aws-sns-push-notification-topic
* aws-sns-webhook-publisher

https://cloud.google.com/pubsub/docs/overview#concepts
https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html

* aws-sns-pubsub-topic
* aws-sqs-pubsub-subscription
* aws-lambda-sqs-processor (general purpose sqs message processing)


cloud-service (general purpose, no particular use case - should this actually happen?)
cloud-service-use-case aws-rds-postgres, aws-rds-mysql
cloud-service-use-case-component aws-sqs-pubsub-subscription - goal is to make it disambigous if there are multiple _ways_ to interact w/ a use case for a particular service

I think we've got a general format

Cloud service use case “role/noun for use case”-

app whats the diff? not much!

AWS sns pubsub topic
AWS RDS MySQL (no role here)
AWS sqs pubsub subscription
AWS s3 application assets bucket (if bucket wasn't here this name would be weird)
AWS lambda http handler
I think the names should be similar/ish across cloud


## where to put?

https://massdriver.productboard.com/roadmap/5083426-sprint-roadmap-sample

remove community and point at GH org convo


# `.app` include in the app guide
## NEW GUIDE DEVELOPMENT

move terminology to 'etc' start w/ overview


