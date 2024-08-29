---
id: troubleshoot
slug: /runbooks/kubernetes/troubleshoot
title: Troubleshoot Alarms
sidebar_label: Troubleshoot Alarms
---

:::note
For information on accessing your Kubernetes cluster running in Massdriver, please check out this [guide](./01-access.md).
:::

## Troubleshooting Kubernetes

Below are the alarms that you may encounter while working with Kubernetes in Massdriver, and how to diagnose the root cause of the issue:

<details>
<summary><h4>Pods not ready</h4></summary>

### Alarm description

`Pods not ready` alarms when one of the pods in your cluster is not ready.

### Diagnosis

To diagnose the issue, you can run the following command:

```bash
kubectl get pods -A                            # Lists all pods in all namespaces
kubectl describe pod <pod-name> -n <namespace> # Describes the pod in detail
```

In the describe output, look at the following sections for clues:

- **Status**: Check if the pod is in the `Running`, `Pending`, `CrashLoopBackOff`, or other state.
- **Conditions**: Look for any conditions that are not `True`, such as `Ready`, `Initialized`, `ContainersReady`, etc.
- **Containers**: Check if the container is in the `Running`, `Terminated`, or `Waiting` state. Look at the `Restart Count` and `Last State` for more information.
- **Events**: Look at the events section for any error messages or warnings.

</details>

<details>
<summary><h4>Pods crash looping</h4></summary>

### Alarm description

`Pods crash looping` alarms when a pod enters a `CrashLoopBackOff` state. This state indicates that the pod is crashing and restarting repeatedly.

### Diagnosis

To diagnose the issue, you can run the following command:

```bash
kubectl get pods -A                     # Lists all pods in all namespaces
kubectl logs <pod-name> -n <namespace>  # Displays the logs of the pod
```

In the logs, look for any error messages or warnings that might indicate why the pod is crashing.

</details>

<details>
<summary><h4>Deployment rollout unsuccessful</h4></summary>

### Alarm description

`Deployment rollout unsuccessful` alarms when a deployment has not been successfully rolled out.

### Diagnosis

To diagnose the issue, you can run the following command:

```bash
kubectl get deployments -A                     # Lists all deployments in all namespaces
kubectl describe deployment <deployment-name>  # Describes the deployment in detail
```

In the describe output, look at the following sections for clues:

- **Replicas**: Check here to ensure that the numbers for `desired`, `updated`, `total`, and `available` match. If any of them do not match, it indicates that the rollout is incomplete or there were issues with the deployment. If you see any `unavailable`, it means that the desired replicas are not running or accessible, possibly due to pod failures or scheduling problems.
- **Conditions**: Look here to verify that `Progressing` is `True` and set to `NewReplicaSetAvailable`, and that `Available` is `True` and set to `MinimumReplicasAvailable`. If these conditions are not met, it suggests the deployment is stuck or failing to roll out properly.
- **StrategyType**: Verify the deployment strategy to ensure proper configuration. Misconfigurations here could cause delays or failures in the rollout process.
- **NewReplicaSet**: Check here to ensure it's creating the proper number of replicas.
- **Events**: Review this section for any error messages or warnings.

</details>

<details>
<summary><h4>DaemonSet rollout unsuccessful</h4></summary>

### Alarm description

`DaemonSet rollout unsuccessful` alarms when a daemonset has not been successfully rolled out.

### Diagnosis

To diagnose the issue, you can run the following command:

```bash
kubectl get daemonset -A                     # Lists all daemonsets in all namespaces
kubectl describe daemonset <daemonset-name>  # Describes the daemonset in detail
```

In the describe output, look at the following sections for clues:

- **Desired Number of Nodes** and **Current Number of Nodes**: Verify these fields match. If they don't match, the daemonset is not scheduled on all nodes.
- **Number of Nodes Scheduled with Up-to-date pods** and **Desired Number of Nodes Scheduled**: Verify these fields match. If they don't match, it means some nodes are running outdated pods.
- **Pod Status**: Check here for pod states: `# Running / # Waiting / # Succeeded / # Failed`. This indicates potential issues with rollout.
- **Events**: Review this section for any error messages or warnings.
- **Node-Selectors** and **Tolerations**: Review this section for node placement configurations. Misconfigurations here could prevent the daemonset from being scheduled on certain nodes.

</details>

<details>
<summary><h4>Autoscaler unscheduled pods</h4></summary>

### Alarm description

`Autoscaler unscheduled pods` alarms when the autoscaler is unable to schedule pods (cannot be placed) and the autoscaler is unable to resolve the issue.

### Diagnosis

To diagnose the issue, you can run the following command:

```bash
kubectl get pods -A                             # Lists all pods in all namespaces
kubectl describe pod <pod-name> -n <namespace>  # Describes the pod in detail
```

In the describe output, look at the following sections for clues:

- **Status**: Ensure the pod is in a `Running` state. If it's in a `Pending` state, it means the pod is not scheduled.
- **Conditions**: Look for any conditions that are not `True`, such as `Ready`, `Initialized`, `ContainersReady`, etc.
- **Node-Selectors** and **Tolerations**: Check if the pod has node selectors or tolerations that prevent it from being scheduled on any node.
- **Requests**: Check if the pod requests are too high for the available resources in the cluster.
- **Events**: Look at the events section for any error messages or warnings.

</details>
