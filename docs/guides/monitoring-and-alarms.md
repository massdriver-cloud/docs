---
id: monitoring-and-alarms
slug: /guides/monitoring-and-alarms
title: Integrating Cloud Monitoring Alarms into Massdriver
sidebar_label: Monitoring & Alerts
---

A **package alarm** is a monitoring mechanism that allows you to track the health and performance of your cloud resources managed through Massdriver packages. Package alarms are directly associated with packages and provide real-time visibility into the state of your infrastructure.

## Relationship to Packages

* **Cardinality**: A package can have multiple alarms associated with it. Each alarm monitors a specific metric or condition for that package’s resources.
* **Lifecycle**: Package alarms are created, updated, and deleted along with their associated packages. When a package is decommissioned, its alarms are automatically cleaned up.

## Supported Cloud Alarm Services

Massdriver integrates with the following cloud provider alarm services:

1. **AWS CloudWatch Alarms**

   * Monitors metrics like CPU utilization, memory usage, and custom metrics
   * Supports both metric-based and expression-based alarms
   * Example: Monitoring RDS instance CPU utilization

2. **Google Cloud Monitoring (formerly Stackdriver)**

   * Monitors GCP resources and custom metrics
   * Supports incident-based alerting
   * Example: Monitoring GKE cluster node health

3. **Azure Monitor**

   * Monitors Azure resources and metrics
   * Supports metric-based alerting with multiple conditions
   * Example: Monitoring Azure Storage account transactions

4. **Prometheus Alertmanager**

   * Monitors Kubernetes and custom metrics
   * Supports complex alerting rules and grouping
   * Example: Monitoring pod readiness and resource usage

## Alarm States

Package alarms can be in one of three states:

1. **OK** – The metric is within normal operating parameters and below the alarm threshold.
2. **ALARM** – The metric has exceeded the configured threshold and triggered the alarm condition.
3. **INSUFFICIENT\_DATA** – There is not enough data collected yet to determine the alarm state (typically occurs when an alarm is first created or after a period of no data).

## Webhook Integration

Package alarms can be integrated with your Massdriver canvas through an automatically generated `alarm_webhook_url`. This webhook URL is unique for each package and follows the format:

```
{alarm_webhook_path_prefix}/{target_id}/{alarm_token}
```

To integrate alarms with your canvas:

1. **Configure** your cloud provider’s alarm/alert service to send notifications to the package’s webhook URL.
2. **Triggering** an alarm will instruct Massdriver to:

   * Update the alarm state in the system
   * Send notifications to configured channels
   * Update the visual state of the package on your canvas
   * Provide detailed information about the alarm condition

## Cloud Provider Integration Examples

For each major cloud platform, you can use Terraform to connect their native alarm/alerting services to Massdriver. The following examples illustrate how to configure an alarm in AWS CloudWatch, Google Cloud Monitoring, Azure Monitor, and Prometheus Alertmanager. In each case, the cloud provider sends alarm notifications to Massdriver’s webhook, and a `massdriver_package_alarm` resource registers the alarm in the Massdriver system.

### AWS (CloudWatch Alarms) + Massdriver

```hcl
# AWS SNS Topic Subscription for Massdriver Webhook
resource "aws_sns_topic_subscription" "main" {
  # string: Webhook endpoint URL
  endpoint  = var.md_metadata.observability.alarm_webhook_url
  # string: Protocol for the subscription
  protocol  = "https"
  # string: SNS topic ARN to subscribe to
  topic_arn = aws_sns_topic.main.arn
}

# AWS CloudWatch Metric Alarm
resource "aws_cloudwatch_metric_alarm" "alarm" {
  count             = var.alarm.alarm_enabled ? 1 : 0
  # string: Name of the CloudWatch alarm (using Massdriver name prefix)
  alarm_name        = "${var.md_metadata.name_prefix}-test-alarm"
  # string: Description of the alarm
  alarm_description = "High CPU utilization alarm for Massdriver"
  
  # Metric to monitor (name and namespace)
  metric_name  = var.alarm.metric_name
  namespace    = var.alarm.metric_namespace

  # Send both ALARM and OK notifications to SNS
  alarm_actions = [aws_sns_topic.main.arn]
  ok_actions    = [aws_sns_topic.main.arn]
  treat_missing_data  = var.alarm.treat_missing_data
  datapoints_to_alarm = 1

  # Map Massdriver comparison operator to AWS format and evaluate over one period
  comparison_operator = local.massdriver_to_aws_comparison_operator[var.alarm.comparison_operator]
  evaluation_periods  = 1
  period              = var.alarm.period       # in seconds
  statistic           = var.alarm.metric_statistic
  threshold           = var.alarm.threshold

  # Include any metric dimensions (convert list of dimensions to map)
  dimensions = try({ for dim in var.alarm.dimensions : dim.name => dim.value }, {})
}

# Massdriver Package Alarm resource (linking the CloudWatch alarm to Massdriver)
resource "massdriver_package_alarm" "aws_package_alarm" {
  count             = var.alarm.alarm_enabled ? 1 : 0
  display_name      = var.alarm.massdriver_display_name
  cloud_resource_id = aws_cloudwatch_metric_alarm.alarm[0].arn

  comparison_operator = var.alarm.comparison_operator
  threshold           = var.alarm.threshold
  period_minutes      = var.alarm.period / 60    # convert seconds to minutes

  metric {
    namespace  = var.alarm.metric_namespace
    name       = var.alarm.metric_name
    statistic  = var.alarm.metric_statistic
    dimensions = aws_cloudwatch_metric_alarm.alarm[0].dimensions
  }
}
```

### GCP (Cloud Monitoring) + Massdriver

```hcl
# GCP Webhook Notification Channel
resource "google_monitoring_notification_channel" "webhook" {
  # string: Display name for the channel
  display_name = "Massdriver Webhook"
  # string: Channel type (webhook)
  type         = "webhook"
  # map(string): Required labels including the webhook URL
  labels = {
    url = var.md_metadata.observability.alarm_webhook_url
  }
}

# GCP Alert Policy (e.g., high CPU utilization)
resource "google_monitoring_alert_policy" "cpu_alert" {
  count = var.alarm.alarm_enabled ? 1 : 0

  # string: Display name for the alert policy
  display_name = "${var.md_metadata.name_prefix} High CPU Alert"
  combiner     = "OR"

  conditions {
    display_name = "High CPU"
    condition_threshold {
      filter          = "metric.type=\"compute.googleapis.com/instance/cpu/utilization\" AND resource.type=\"gce_instance\""
      comparison      = "COMPARISON_GT"
      threshold_value = var.alarm.threshold
      duration        = "${var.alarm.period}s"
      trigger {
        count = 1
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.webhook.name]
}

# Massdriver Package Alarm resource for GCP
resource "massdriver_package_alarm" "gcp_package_alarm" {
  count             = var.alarm.alarm_enabled ? 1 : 0
  display_name      = var.alarm.massdriver_display_name
  cloud_resource_id = google_monitoring_alert_policy.cpu_alert[0].name

  comparison_operator = var.alarm.comparison_operator
  threshold           = var.alarm.threshold
  period_minutes      = var.alarm.period / 60  # convert seconds to minutes

  metric {
    namespace  = "compute.googleapis.com/instance"
    name       = "cpu/utilization"
    statistic  = "average"
    dimensions = {}
  }
}
```

### Azure (Monitor Alerts) + Massdriver

```hcl
# Azure Action Group with webhook receiver
resource "azurerm_monitor_action_group" "webhook" {
  name                = "massdriver-actiongroup"
  resource_group_name = var.resource_group
  short_name          = "mdwebhook"

  webhook_receiver {
    name                    = "massdriver"
    service_uri             = var.md_metadata.observability.alarm_webhook_url
    use_common_alert_schema = true
  }
}

# Azure Metric Alert (e.g., high CPU on a VM)
resource "azurerm_monitor_metric_alert" "cpu_alert" {
  count               = var.alarm.alarm_enabled ? 1 : 0
  name                = "${var.md_metadata.name_prefix}-cpu-alert"
  resource_group_name = var.resource_group
  scopes              = [var.target_resource_id]   # target resource to monitor
  description         = "High CPU on Azure VM"
  severity            = 2
  frequency           = "PT1M"   # evaluation frequency (1 minute)
  window_size         = "PT5M"   # evaluation window (5 minutes)

  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachines"
    metric_name      = "Percentage CPU"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.alarm.threshold
  }

  action {
    action_group_id    = azurerm_monitor_action_group.webhook.id
    webhook_properties = {}
  }
}

# Massdriver Package Alarm resource for Azure
resource "massdriver_package_alarm" "azure_package_alarm" {
  count             = var.alarm.alarm_enabled ? 1 : 0
  display_name      = var.alarm.massdriver_display_name
  cloud_resource_id = azurerm_monitor_metric_alert.cpu_alert[0].id

  comparison_operator = var.alarm.comparison_operator
  threshold           = var.alarm.threshold
  period_minutes      = 5  # Azure uses fixed window size (5 minutes here)

  metric {
    namespace  = "Microsoft.Compute/virtualMachines"
    name       = "Percentage CPU"
    statistic  = "Average"
    dimensions = {}
  }
}
```

### Alertmanager (Kubernetes) + Massdriver

```hcl
# Alertmanager ConfigMap with webhook receiver configuration
resource "kubernetes_config_map" "alertmanager" {
  metadata {
    name      = "alertmanager-config"
    namespace = "monitoring"
  }

  data = {
    "alertmanager.yaml" = <<-EOT
      global: {}

      route:
        receiver: "massdriver-webhook"

      receivers:
        - name: "massdriver-webhook"
          webhook_configs:
            - url: "${var.md_metadata.observability.alarm_webhook_url}"
    EOT
  }
}

# Massdriver Package Alarm resource for Alertmanager
resource "massdriver_package_alarm" "alertmanager_package_alarm" {
  count             = var.alarm.alarm_enabled ? 1 : 0
  display_name      = var.alarm.massdriver_display_name
  cloud_resource_id = "k8s://monitoring/alertmanager-config"

  comparison_operator = var.alarm.comparison_operator
  threshold           = var.alarm.threshold
  period_minutes      = var.alarm.period

  metric {
    namespace  = "custom/alertmanager"
    name       = "custom_alert"
    statistic  = "firing"
    dimensions = {}
  }
}
```

## API Integration

You can also register alarms programmatically using the Massdriver API, which allows integration into scripts or CI/CD pipelines. The example below demonstrates creating a new package alarm with a simple HTTP request (using `curl`). Once this API call is executed, the alarm becomes active and its state will be tracked and visualized on your Massdriver canvas in real time (just like alarms created via Terraform or the UI).

```bash
# Register a new package alarm via API
curl -X POST \
  "https://api.massdriver.cloud/v1/packages/{package_id}/alarms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "display_name": "High CPU Utilization",
    "cloud_resource_id": "arn:aws:cloudwatch:us-west-2:123456789012:alarm:test-alarm",
    "metric": {
      "name": "CPUUtilization",
      "namespace": "AWS/EC2",
      "statistic": "Average",
      "dimensions": [
        {
          "name": "InstanceId",
          "value": "i-1234567890abcdef0"
        }
      ]
    },
    "comparison_operator": "GREATER_THAN",
    "threshold": 80.0,
    "period_minutes": 5
  }'
```

### API Parameters

1. **Required Parameters**:

   * `display_name`: A human-readable name for the alarm
   * `cloud_resource_id`: The cloud provider’s unique identifier for the alarm

     * AWS format: `arn:aws:cloudwatch:<region>:<account-id>:alarm:<alarm-name>`
     * Azure format: `/subscriptions/<subscription-id>/providers/Microsoft.AlertsManagement/alerts/<alert-id>`
     * GCP format: `projects/<project-id>/alertPolicies/<policy-id>`

2. **Optional Parameters**:

   * `metric`: Object containing metric details

     * `name`: The specific metric being monitored (e.g., `"CPUUtilization"`)
     * `namespace`: The cloud provider’s metric namespace (e.g., `"AWS/EC2"`)
     * `statistic`: The statistical aggregation for the metric (e.g., `"Average"`, `"Sum"`, `"Maximum"`)
     * `dimensions`: An array of key/value pairs identifying the resource (e.g., an Instance ID)
   * `comparison_operator`: One of `"GREATER_THAN"`, `"LESS_THAN"`, `"GREATER_THAN_OR_EQUAL_TO"`, or `"LESS_THAN_OR_EQUAL_TO"`
   * `threshold`: The numeric value that triggers the alarm when the metric crosses it
   * `period_minutes`: The time window in minutes over which the metric is evaluated (evaluation period)

## Best Practices

1. **Alarm Configuration**

   * Set appropriate thresholds based on your application’s normal performance range.
   * Use multiple evaluation periods (data points) to avoid false positives from transient spikes.
   * Include meaningful alarm descriptions so it’s clear what condition is being monitored.

2. **Notification Management**

   * Configure proper notification channels (email, Slack, etc.) for alarm actions.
   * Set up escalation paths for critical alarms (e.g., paging on-call engineers for production issues).
   * Group and prioritize alarms to reduce notification fatigue and noise.

3. **Integration**

   * Regularly test your alarm webhook integrations to ensure alerts are being received by Massdriver.
   * Continuously monitor alarm state changes on the canvas to verify that alarms transition between OK/ALARM as expected.
   * Review and update alarm configurations as your infrastructure and application evolve to keep alarms relevant and useful.
