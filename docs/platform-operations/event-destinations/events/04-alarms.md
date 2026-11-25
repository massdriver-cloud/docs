---
id: event-reference-alarms
slug: /platform-operations/event-destinations/events/alarms
title: Alarm Events
sidebar_label: Alarms
---

For the fields that every event has, refer to [Event Reference](/platform-operations/event-destinations/events). For how alarms get into Massdriver, refer to [Monitoring and Alarms](/platform-operations/monitoring-and-alarms).

Massdriver records alarm events on its own, so they have no `data.actor`. Their `data.attributes` are the attributes of the instance of the alarm: `md-project`, `md-environment`, `md-component`, `md-instance`, `md-repo`, `md-bundle`, the custom attributes of the instance, and `md-id`, the identifier of the instance.

## Alarm

An alarm is a cloud alarm that a bundle registered on an instance.

| Event type | Occurs when |
|---|---|
| `alarm.created` | An alarm was registered on an instance. |
| `alarm.updated` | The settings of an alarm changed. |
| `alarm.deleted` | An alarm was removed from an instance. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the alarm. |
| `display_name` | string | The name of the alarm, such as `High CPU`. |
| `cloud_resource_id` | string | The ID of the alarm in the cloud, such as an ARN. |
| `comparison_operator` | string or null | How the cloud compares the metric with `threshold`, such as `GreaterThanThreshold`. |
| `threshold` | number or null | The value that sets off the alarm. |
| `period` | integer or null | The length of the evaluation period, in seconds. |
| `metric` | object or null | The metric of the alarm: `namespace`, `name`, `statistic`, `region`, and `dimensions`, a list of `name` and `value` pairs. |
| `instance_id` | UUID | The ID of the instance. |
| `created_at`, `updated_at` | time | |

### Example conditions

| To send | Events | Condition |
|---|---|---|
| CloudWatch alarms on RDS metrics | `alarm.created` | `.data.entity.metric.namespace == "AWS/RDS"` |
| Alarms in one region | `alarm.*` | `.data.entity.metric.region == "us-east-1"` |

## Alarm state

An alarm state is a change of the state of an alarm that the cloud sent to Massdriver.

| Event type | Occurs when |
|---|---|
| `alarm_state.created` | An alarm changed state, for example from `OK` to `ALARM`. |

### `data.entity`

| Field | Type | Value |
|---|---|---|
| `id` | UUID | The ID of the alarm state. |
| `status` | string | `ALARM` or `OK`. |
| `alarm_name` | string | The `display_name` of the alarm. |
| `message` | string | The reason for the change that the cloud sent. |
| `occurred_at` | time | When the change occurred in the cloud. |
| `provider_notification_id` | string | The ID of the notification in the cloud. |
| `notification` | map | The notification as the cloud sent it. Its fields change with the cloud. |
| `alarm_id` | UUID | The ID of the alarm. |
| `created_at`, `updated_at` | time | |

### Example

```json
{
  "type": "alarm_state.created",
  "data": {
    "entity": {
      "id": "a1c3e5f7-2b4d-4f6a-8c0e-1d3f5a7b9c20",
      "status": "ALARM",
      "alarm_name": "High CPU",
      "message": "CPUUtilization > 80 for 3 datapoints within 15 minutes",
      "occurred_at": "2026-11-19T15:04:11Z",
      "provider_notification_id": "b7e2f0c4-9d1a-4e3b-8f5c-2a6d0e4b8c13",
      "notification": { "AlarmName": "api-prod-database-high-cpu", "NewStateValue": "ALARM" },
      "alarm_id": "4d6f8a0c-3e5b-4a7d-9f1c-6b8d0a2c4e57",
      "created_at": "2026-11-19T15:04:12Z",
      "updated_at": "2026-11-19T15:04:12Z"
    },
    "metadata": { "credential": "system" },
    "attributes": {
      "md-id": "api-prod-database",
      "md-project": "api",
      "md-environment": "prod",
      "md-component": "database",
      "md-instance": "api-prod-database",
      "md-repo": "aws-rds-postgres",
      "md-bundle": "aws-rds-postgres@1.4.2"
    }
  }
}
```

### Example conditions

| To send | Events | Condition |
|---|---|---|
| Alarms that fire, not alarms that clear | `alarm_state.created` | `.data.entity.status == "ALARM"` |
| One alarm by name | `alarm_state.created` | `.data.entity.alarm_name == "High CPU"` |
| Alarms on databases in production | `alarm_state.created` | `.data.attributes["md-environment"] == "prod" and .data.attributes["md-component"] == "database"` |
| CPU alarms on every instance | `alarm_state.created` | `.data.entity.alarm_name \| test("cpu"; "i")` |
