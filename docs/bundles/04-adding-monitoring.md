---
id: bundles-add-monitoring
slug: /bundles/add-monitoring
title: Adding Monitoring
sidebar_label: Monitoring
---

Adding monitorning to your bundle is easy. For general use-cases, you can take advantge of the Terraform modules we've [open-sourced](https://github.com/massdriver-cloud/terraform-modules).

## Adding An Alarm Channel

First, you'll need to add an alarm channel to your bundle. This is how your alarms get registered with Massdriver. Usually, we'll add a file named `monitoring.tf` to the bundle for this code.

```hcl title="AWS Alarm Channel"
module "alarm_channel" {
  source      = "github.com/massdriver-cloud/terraform-modules//aws-alarm-channel?ref=aa08797"
  md_metadata = var.md_metadata
}
```

```hcl title="Azure Alarm Channel"
module "alarm_channel" {
  source              = "github.com/massdriver-cloud/terraform-modules//azure-alarm-channel?ref=40d6e54"
  md_metadata         = var.md_metadata
  resource_group_name = azurerm_resource_group.main.name
}
```

```hcl title="GCP Alarm Channel"
module "alarm_channel" {
  source      = "github.com/massdriver-cloud/terraform-modules//gcp-alarm-channel?ref=bfcf556"
  md_metadata = var.md_metadata
}
```


## Adding An Alarm

Once our channel has been set up, we can add 1 or more alarms.

```hcl title="AWS Alarm"
locals {
  memory_usage_threshold = "90"
  member_clusters_count  = var.cluster_mode_enabled ? (var.node_groups * (var.replicas + 1)) : var.replicas + 1
  member_clusters_list   = tolist(aws_elasticache_replication_group.main.member_clusters)
}

module "memory_usage_alarm" {
  source        = "github.com/massdriver-cloud/terraform-modules//aws-cloudwatch-alarm?ref=8997456"
  count         = local.member_clusters_count
  sns_topic_arn = module.alarm_channel.arn
  depends_on = [
    aws_elasticache_replication_group.main
  ]

  md_metadata         = var.md_metadata
  display_name        = "Memory Usage"
  message             = "Elasticache Redis ${element(local.member_clusters_list, count.index)}: Memory Usage > ${local.memory_usage_threshold}"
  alarm_name          = "${element(local.member_clusters_list, count.index)}-highMemoryUsage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = local.memory_usage_threshold

  dimensions = {
    CacheClusterId = element(local.member_clusters_list, count.index)
  }
}
```

```hcl title="Azure Alarm"
locals {
  scope_config = {
    severity    = "1"
    frequency   = "PT1M"
    window_size = "PT5M"
  }
  metric_config = {
    operator              = "GreaterThan"
    aggregation           = "Average"
    threshold_cpu         = 90
    threshold_memory      = 90
    threshold_server_load = 90
  }
}

module "memory_metric_alert" {
  source                  = "github.com/massdriver-cloud/terraform-modules//azure-monitor-metrics-alarm?ref=40d6e54"
  scopes                  = [azurerm_redis_cache.main.id]
  resource_group_name     = azurerm_resource_group.main.name
  monitor_action_group_id = module.alarm_channel.id
  severity                = local.scope_config.severity
  frequency               = local.scope_config.frequency
  window_size             = local.scope_config.window_size

  md_metadata  = var.md_metadata
  display_name = "Memory Usage"
  message      = "High Memory Usage"

  alarm_name       = "${var.md_metadata.name_prefix}-highMemoryUsage"
  operator         = local.metric_config.operator
  metric_name      = "allusedmemorypercentage"
  metric_namespace = "Microsoft.Cache/Redis"
  aggregation      = local.metric_config.aggregation
  threshold        = local.metric_config.threshold_memory

  dimensions = [{
    name     = "Primary"
    operator = "Include"
    values   = ["*"]
  }]
}
```

```hcl title="GCP Alarm"
locals {
  metrics = {
    memory = {
      metric     = "redis.googleapis.com/stats/memory/usage_ratio"
      resource   = "redis_instance"
    }
  }
  threshold_memory = 0.9
}

module "database_memory_alarm" {
  source                  = "github.com/massdriver-cloud/terraform-modules//gcp-monitoring-utilization-threshold?ref=cafdc89"
  notification_channel_id = module.alarm_channel.id
  md_metadata             = var.md_metadata
  display_name            = "Memory Usage"
  message                 = "Cloud SQL Postgres ${google_redis_instance.redis.id}: Memory capacity over threshold ${local.threshold_memory * 100}%"
  alarm_name              = "${google_redis_instance.redis.id}-highMemory"
  metric_type             = local.metrics["memory"].metric
  resource_type           = local.metrics["memory"].resource
  threshold               = local.threshold_memory
  period                  = 60
  duration                = 60
}
```


## Roll your own

If you don't want to use our Terraform modules for your alarms, you don't have to. You'll still need to create the `alarm_channel` to connect to Massdriver, but from there you can take a look at our modules to see how we're connecting metrics from various clouds to Massdriver.
