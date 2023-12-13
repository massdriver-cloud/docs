# The Massdriver Bundle Spec

## Sumary

Massdriver bundles are a wrapper around infrastructure-as-code tools like Terraform or Helm. Bundles provide a way of visualizing the infrastructure or application on the Massdriver canvas, providing a rich user interface to the end-user, and ensuring valid connections between infrastructure.

Bundles should represent reusable pieces of architecture that clearly define security, compliance, and best practices. Bundles can be connected by passing their outputs to the inputs of other bundles to rapidly create novel architectures while shrinking the surface area of the cloud.

:::note
Singleton resources like _container repositories_, _DNS Zones_, and _transit gateways_ are examples of resources that **do not** fit well into Massdriver bundles.

Some resources like _DNS Zones_ are supported as first class citizens in Massdriver.

If you need help with incorporating a singleton resource in Massdriver, feel free to [contact us](https://roadmap.massdriver.cloud). We're always happy to help.
:::

### SQS Example

The Massdriver official SQS subscriber bundle [link] contains the following resources:
The primary queue where data will be read from and written to.
A dead letter queue to ensure data redundancy. This is a hard requirement and not an option.
A read policy for a downstream service to use to enable read access to the queue.
Default alarms for dead letter queue depth so engineers don’t have to think about how to know there is something wrong in their system. They get it out of the box.
A policy attachment to allow SNS to send messages to SQS enabling fanout.

With this bundle we have clearly defined the way that we run SQS here at Massdriver. We have defined limited access policies, enabled redundancy, and provided default alarms so our engineers don’t have to think about the cloud, they think about the APIs that their services consume. Engineers can reuse this over and over with the same user experience allowing easy knowledge transfer without reading endless documentation.

## Anatomy of a Bundle

### Params Schema: The power of your tooling without the docs

Parameters define the user interface for infrastructure modules in Massdriver. Regardless of the underlying tooling, the parameters provide consistency. The schema is defined with JSON Schema Draft 7 [link] and allows operations professionals to provide rich validation and context-aware forms to keep product engineers safe from misconfiguration. Massdriver provides additional form elements available via annotation for functionality like immutability, uniqueness in lists, and data conversion.

<iframe width="560" height="315" src="https://www.youtube.com/embed/JdZ0-M9Ba4E?si=dlGFIuE4muQTvBGv" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### Artifacts Schema: Standardizing the language of your operations tooling

To enable interoperability of operations tooling and modularity of resources, all modules and the underlying tooling must speak the same language. Most tooling can read JSON, but there is no universal output format. Artifact Schemas solves this by creating a specification for validating JSON output. Your module defines what it created with resource IDs, includes security details created like IAM policies and security groups, and validates that the module produces an expected output. This allows information to flow between modules regardless of the tooling under the hood. No copy/paste required.

#### Example Artifact Output

```json
{
  "data": {
    "infrastructure": {
      "arn": "arn:aws:dynamodb:us-west-2:000000000000:table/loadtst-staging-ddb-c0dk"
    },
    "security": {
      "iam": {
        "read": {
          "policy_arn": "arn:aws:iam::000000000000:policy/loadtst-staging-ddb-c0dk-read"
        },
        "read_write": {
          "policy_arn": "arn:aws:iam::000000000000:policy/loadtst-staging-ddb-c0dk-read-and-write"
        },
        "write": {
          "policy_arn": "arn:aws:iam::000000000000:policy/loadtst-staging-ddb-c0dk-write"
        }
      }
    }
  },
  "specs": {
    "aws": {
      "region": "us-west-2"
    }
  }
}
```

In this example, we have defined an artifact for a DynamoDB table. The data block defines values that are passed between bundles enabling connectivity. The infrastructure block states what was created and provides the resource ID downstream. The security block defines policy-based access. In this case, we have defined a read-only role, a write-only role, and a combined read/write role. These values are passed downstream allowing the consumer to pick the policy with the least access for it’s use-case. The spec block is a metadata block for constraining input in a Connection’s Schema, and providing useful information to human users like access URLs.

### Connections Schema: A type system for the cloud

The ability to define dependencies and work backward is a standout feature of the bundle specification. The Connections Schema defines what your application or infrastructure requires, and defines the expected structure of incoming artifacts. This enables you to validate configurations of an incoming artifact, like sufficiently secure subnets in a network where you are deploying a database. Developers don’t have to think about the security, they just deploy what they need and the platform takes care of the rest.

## Putting It All Together: The power of a common language

The power of structured inputs and outputs allows us to create a type-system that arbitrates the relationships between bundles and helps engineers understand the requirements of their architecture. Designing complex systems with reusable modules is effortless.

<iframe width="560" height="315" src="https://www.youtube.com/embed/Wx1DIQUr2wM?si=pL5t-JMKCPQ2LV4E" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
