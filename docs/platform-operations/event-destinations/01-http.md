---
id: event-destinations-http
slug: /platform-operations/event-destinations/http
title: HTTP Event Destinations
sidebar_label: HTTP
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The `HTTP` adapter sends each event to your URL in a `POST` request. The body is one [CloudEvent](/platform-operations/event-destinations#the-event) in JSON structured mode. Massdriver signs each request with the [Standard Webhooks](https://www.standardwebhooks.com) method.

For the events that a destination receives, retries, deliveries, and pause, refer to [Event Destinations](/platform-operations/event-destinations).

## Settings

| Object | Field | Value |
|---|---|---|
| `config` | `url` | The URL that receives the events. It must start with `http://` or `https://` and include a host. Required. |
| `config` | `headers` | Header names and values that Massdriver sends with each request. Do not put credentials here. |
| `auth` | `headers` | Header names and values that hold credentials, such as `Authorization`. Massdriver sends them with each request. |

When you save a destination, Massdriver refuses a URL whose host is a private address. Refer to [Private addresses](#private-addresses).

## Send events to your computer

To see the events before you build a real endpoint, run a small receiver on your computer and open a tunnel to it. The tunnel gives the receiver a public `https://` URL that Massdriver can reach.

### 1. Open a tunnel

Use one of these tools. Each one prints a public `https://` URL that forwards to port `8080` on your computer.

<Tabs groupId="tunnel">
<TabItem value="ngrok" label="ngrok">

Install [ngrok](https://ngrok.com/download) and add your auth token. Then run:

```bash
ngrok http 8080
```

The `Forwarding` line shows the URL, such as `https://<id>.ngrok-free.app`. To see each request and the response of your receiver, open the ngrok inspector at `http://localhost:4040`.

</TabItem>
<TabItem value="cloudflared" label="Cloudflare Tunnel">

Install [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/). A quick tunnel does not need a Cloudflare account. Run:

```bash
cloudflared tunnel --url http://localhost:8080
```

The output shows the URL, such as `https://<words>.trycloudflare.com`.

</TabItem>
<TabItem value="localhost-run" label="localhost.run">

[localhost.run](https://localhost.run) uses SSH, so you do not install a tool. Run:

```bash
ssh -R 80:localhost:8080 nokey@localhost.run
```

The output shows the URL.

</TabItem>
</Tabs>

These tools give a new URL each time that you start them, unless you have a fixed domain. When the URL changes, change the **URL** on the **Settings** tab of the destination.

### 2. Create the destination

Create a destination as shown in [Add a destination](/platform-operations/event-destinations#add-a-destination). Set the **URL** to the URL of the tunnel, and select the event type `project.created`.

Copy the signing secret from the **Overview** tab of the destination.

### 3. Run a receiver

The receiver verifies the signature of each request, prints the event, and responds with `204`. It refuses a request with a signature that is not correct with `401`. Massdriver does not retry a `401`. Both receivers listen on port `8080`, and use only the standard library.

<Tabs groupId="language">
<TabItem value="python" label="Python">

Python 3.9 or later. Save this as `receiver.py`:

```python
import base64
import hashlib
import hmac
import json
import os
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

SECRET = os.environ["MASSDRIVER_SIGNING_SECRET"]
TOLERANCE_SECONDS = 5 * 60


def verify(headers, body: bytes) -> bool:
    msg_id = headers.get("webhook-id")
    timestamp = headers.get("webhook-timestamp")
    signatures = headers.get("webhook-signature")

    if not (msg_id and timestamp and signatures and timestamp.isdigit()):
        return False
    if abs(time.time() - int(timestamp)) > TOLERANCE_SECONDS:
        return False

    key = base64.b64decode(SECRET.removeprefix("whsec_"))
    signed = f"{msg_id}.{timestamp}.".encode() + body
    expected = base64.b64encode(hmac.new(key, signed, hashlib.sha256).digest()).decode()

    for signature in signatures.split(" "):
        version, _, value = signature.partition(",")
        if version == "v1" and hmac.compare_digest(value, expected):
            return True

    return False


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("content-length", 0)))

        if not verify(self.headers, body):
            self.send_response(401)
            self.end_headers()
            return

        event = json.loads(body)
        print(event["id"], event["type"], event["subject"], flush=True)

        self.send_response(204)
        self.end_headers()


HTTPServer(("", 8080), Handler).serve_forever()
```

```bash
MASSDRIVER_SIGNING_SECRET='whsec_...' python3 receiver.py
```

</TabItem>
<TabItem value="node" label="Node.js">

Node.js 18 or later. Save this as `receiver.mjs`:

```js
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

const SECRET = process.env.MASSDRIVER_SIGNING_SECRET;
const TOLERANCE_SECONDS = 5 * 60;

function verify(headers, body) {
  const id = headers["webhook-id"];
  const timestamp = headers["webhook-timestamp"];
  const signatures = headers["webhook-signature"];

  if (!id || !/^\d+$/.test(timestamp ?? "") || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(SECRET.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.`).update(body).digest();

  return signatures.split(" ").some((signature) => {
    const [version, value] = signature.split(",");
    if (version !== "v1" || !value) return false;
    const actual = Buffer.from(value, "base64");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
}

createServer((req, res) => {
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const body = Buffer.concat(chunks);

    if (req.method !== "POST" || !verify(req.headers, body)) {
      res.writeHead(401).end();
      return;
    }

    const event = JSON.parse(body);
    console.log(event.id, event.type, event.subject);

    res.writeHead(204).end();
  });
}).listen(8080);
```

```bash
MASSDRIVER_SIGNING_SECRET='whsec_...' node receiver.mjs
```

</TabItem>
</Tabs>

### 4. Send an event

To check the connection first, click **Send test event** on the destination. Your receiver prints an `event_destination.tested` event.

1. Create a project. Massdriver records a `project.created` event.
2. Your receiver prints the `id`, `type`, and `subject` of the event. On the **Deliveries** tab, the event is **Delivered**.

To see a retry, stop the receiver and create one more project. The tunnel cannot reach the receiver, so it responds with a `5xx` status. On the **Deliveries** tab, the event is **Waiting**, and **Last error** shows the status. Start the receiver again. Massdriver sends the event at the next attempt. Refer to [Retry schedule](/platform-operations/event-destinations#retry-schedule).

If your receiver responds with `401`, the signing secret is not correct. Copy it again from the **Overview** tab.

## Use cases

Each use case is one destination. For the attribute keys, refer to [Attribute keys](/platform-operations/event-destinations#attribute-keys).

### Send the whole audit log to a SIEM or a data warehouse

| Setting | Value |
|---|---|
| Events | (empty), for every event |
| Attributes | (empty). Any attribute removes the events that have no attributes, such as access token events. |
| Condition | (empty) |

The receiver stores each event as it comes. Use the event `id` to drop duplicates, and the event `time` to sort.

### Start a pipeline after a deployment

| Setting | Value |
|---|---|
| Events | `deployment.completed` |
| Attributes | `{"md-environment": "staging", "md-component": "api"}`, for the deployments of one component in one environment |
| Condition | `.data.metadata.deployment_action == "PROVISION"`, to skip plans and removals |

For example, the receiver starts the integration tests for the staging API. `data.attributes["md-instance"]` names the instance, and `data.attributes["md-bundle"]` names the bundle version that was deployed.

### Keep an inventory or a CMDB up to date

| Setting | Value |
|---|---|
| Events | `instance.*`, `resource.*` |
| Attributes | `{"md-environment": "prod"}`, or empty for every environment |
| Condition | (empty) |

`instance.created`, `instance.deleted`, `resource.provisioned`, and `resource.deleted` tell the receiver which instances and resources exist. Resource events carry `md-resource-type`.

### Page on-call with your own tool

| Setting | Value |
|---|---|
| Events | `alarm_state.created`, `deployment.failed` |
| Attributes | `{"md-environment": "prod"}` |
| Condition | `.type != "alarm_state.created" or .data.entity.status == "ALARM"` |

The receiver opens a page for each event and uses the event `id` as the key that drops duplicates.

## The request

Massdriver sends a `POST` request to the `url` in the destination's `config`. The body is one [CloudEvent](/platform-operations/event-destinations#the-event) in JSON structured mode.

| Header | Value |
|---|---|
| `content-type` | `application/cloudevents+json` |
| `webhook-id` | The CloudEvent `id`. It is the same for every attempt of the event. |
| `webhook-timestamp` | The time of this attempt, in seconds since the Unix epoch. It changes for each attempt. |
| `webhook-signature` | `v1,` followed by the base64 signature of the request. Refer to [Verify the signature](#verify-the-signature). |

### Custom headers

Massdriver sends the headers in `config.headers` and `auth.headers` with each request. Massdriver changes header names to lowercase. If a header in `auth.headers` has the same name as a header in `config.headers`, Massdriver sends the value from `auth.headers`.

If a custom header has the same name as one of the headers in the table above, Massdriver sends its own value and ignores your value. Massdriver does not send a custom `host` header. The `host` header always names the host of the URL.

## Verify the signature

Each HTTP destination has its own signing secret. Get it from the **Overview** tab of the destination, or from the [`signingSecret`](/api/graphql/types/objects/event-destination#signing-secret) field. The secret has the form `whsec_` followed by base64.

The signature is the HMAC-SHA256 of `<webhook-id>.<webhook-timestamp>.<body>`. The key is the base64-decoded part of the secret after `whsec_`. The `webhook-signature` header holds `v1,` followed by the base64 of the signature.

To verify a request:

1. Read the raw request body. Do not parse and encode the JSON again before you verify it.
2. Make sure that `webhook-timestamp` is near your current time. The Standard Webhooks specification recommends a tolerance of 5 minutes. This stops replay of old requests.
3. Calculate the signature and compare it to each `v1` value in `webhook-signature`. Use a constant-time comparison.
4. If no value is equal, refuse the request.

The `verify` functions in [Run a receiver](#3-run-a-receiver) do these steps. The Standard Webhooks project also has [libraries](https://github.com/standard-webhooks/standard-webhooks/tree/main/libraries) for many languages.

## Responses

Massdriver waits 10 seconds for a response. Massdriver does not follow redirects.

| Result | What Massdriver does |
|---|---|
| `2xx` | The event is sent. |
| `408`, `429`, `5xx` | Massdriver retries the event. |
| No response in 10 seconds, a connection that cannot be made, or the host does not resolve | Massdriver retries the event. |
| Any other status, including `3xx` redirects and other `4xx` | The event becomes a failed event at once. |
| The host is a private address | The event becomes a failed event at once. Refer to [Private addresses](#private-addresses). |

The destination's `lastError` field shows the status, for example `HTTP 503`. Refer to [Failures and retries](/platform-operations/event-destinations#failures-and-retries).

## Private addresses

Massdriver refuses to send events to private addresses. Massdriver checks the host of the URL at two times:

- When you save a destination, Massdriver refuses a URL whose host is a private address. Massdriver accepts a host that does not resolve yet.
- Before each send, Massdriver resolves the host again. If one or more of its addresses is private, the event becomes a failed event at once. Massdriver sends the request to the address that it checked.

These addresses are private:

- IPv4: `0.0.0.0/8`, `10.0.0.0/8`, `100.64.0.0/10`, `127.0.0.0/8`, `169.254.0.0/16`, `172.16.0.0/12`, `192.0.0.0/24`, `192.168.0.0/16`, `198.18.0.0/15`, and all addresses from `224.0.0.0` up.
- IPv6: `fc00::/7`, `fe80::/10`, `ff00::/8`, and Teredo (`2001::/32`).
- IPv6 addresses that hold a private IPv4 address: IPv4-compatible (`::/96`, which includes `::` and `::1`), IPv4-mapped (`::ffff:0:0/96`), 6to4 (`2002::/16`), and NAT64 (`64:ff9b::/96`).

Thus a destination cannot use `http://localhost:8080` directly. Use a tunnel, as shown in [Send events to your computer](#send-events-to-your-computer). A self-hosted installation can allow private addresses with `MD_EVENT_DESTINATIONS_ALLOW_PRIVATE_ADDRESSES`.
