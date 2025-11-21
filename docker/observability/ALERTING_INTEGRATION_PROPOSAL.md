# Alerting Integration Proposal - UNS-ClaudeJP 6.0.0

## Executive Summary

This document proposes a comprehensive alerting integration strategy for the UNS-ClaudeJP HR application, incorporating Slack and Email notifications to ensure rapid response to critical system events and proactive monitoring of application health.

## Current State

### Existing Infrastructure
- ✅ Prometheus with comprehensive alert rules
- ✅ Grafana for visualization and alerting
- ✅ OpenTelemetry for distributed tracing
- ✅ SMTP configuration in `.env` for email delivery
- ✅ Alert rules for:
  - Service availability (backend, database, OTel)
  - Error rates (HTTP 4xx/5xx, OCR failures)
  - Performance (response time, processing speed)
  - Resource utilization (CPU, memory, disk)
  - Database health (connections, queries)

### Current Limitations
- ❌ No real-time notifications to team members
- ❌ No escalation policies for critical alerts
- ❌ No centralized alert management
- ❌ No audit trail for alert responses
- ❌ Limited visibility for on-call engineers

---

## Proposed Solution

### Architecture Overview

```
┌─────────────────┐
│   Prometheus    │  ← Scrapes metrics
│  (Alert Rules)  │  ← Evaluates conditions
└────────┬────────┘
         │ Alerts
         ↓
┌─────────────────┐
│    Grafana      │  ← Manages contact points
│   (Alerting)    │  ← Routes notifications
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌────────┐ ┌────────┐
│ Slack  │ │ Email  │
└────────┘ └────────┘
```

---

## Integration Plan

### Phase 1: Email Notifications (Week 1)

#### Objective
Establish reliable email-based alerting for all critical and warning-level alerts.

#### Implementation Steps

1. **SMTP Configuration** (Already configured in `.env`)
   ```env
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=monitoring@uns-kikaku.com
   SMTP_PASSWORD=<app-specific-password>
   SMTP_FROM=noreply@uns-kikaku.com
   ```

2. **Grafana Email Contact Point**
   - **Name**: `Email - Critical Alerts`
   - **Recipients**:
     - `devops@uns-kikaku.com` (all alerts)
     - `it-manager@uns-kikaku.com` (critical only)
     - `hr-admin@uns-kikaku.com` (payroll-related)
   - **Template**: Custom HTML template with alert details
   - **Rate Limiting**: Max 1 email per alert per 5 minutes

3. **Email Template Design**
   ```html
   Subject: [{{ .Status }}] {{ .GroupLabels.alertname }} - UNS-ClaudeJP

   Alert: {{ .GroupLabels.alertname }}
   Severity: {{ .Labels.severity }}
   Status: {{ .Status }}

   Summary: {{ .Annotations.summary }}
   Description: {{ .Annotations.description }}

   Time: {{ .StartsAt }}
   Dashboard: {{ .DashboardURL }}
   Panel: {{ .PanelURL }}

   ---
   UNS-ClaudeJP Monitoring System
   ```

4. **Notification Policies**
   - **Critical**: Immediate email + follow-up if not acknowledged in 15 minutes
   - **Warning**: Email after 5 minutes (to reduce noise)
   - **Info**: Daily digest email

#### Benefits
- ✅ Permanent record of all alerts
- ✅ Works without additional dependencies
- ✅ Can be integrated with email filtering rules
- ✅ Suitable for regulatory compliance

#### Limitations
- ⚠️ Not real-time (email delivery delays)
- ⚠️ Easy to miss in cluttered inboxes
- ⚠️ No threading or context preservation
- ⚠️ Limited interaction (can't acknowledge/silence)

---

### Phase 2: Slack Integration (Week 2-3)

#### Objective
Provide real-time, interactive alerting through Slack with rich formatting and team collaboration.

#### Implementation Steps

1. **Create Slack Workspace Channels**
   ```
   #monitoring-critical   → Critical alerts only (24/7 monitoring)
   #monitoring-warnings   → Warning-level alerts (business hours)
   #monitoring-info       → Informational alerts (daily digest)
   #payroll-alerts        → Payroll-specific alerts
   #database-alerts       → Database performance alerts
   ```

2. **Slack Incoming Webhook Setup**
   - Navigate to: https://api.slack.com/apps
   - Create new app: "UNS-ClaudeJP Monitoring"
   - Enable Incoming Webhooks
   - Create webhooks for each channel:
     ```
     #monitoring-critical: https://hooks.slack.com/services/XXX/YYY/ZZZ
     #monitoring-warnings: https://hooks.slack.com/services/XXX/YYY/AAA
     #payroll-alerts:      https://hooks.slack.com/services/XXX/YYY/BBB
     ```

3. **Grafana Slack Contact Points**

   **Critical Alerts Channel:**
   - **Name**: `Slack - Critical`
   - **Webhook URL**: `<critical-channel-webhook>`
   - **Username**: `Grafana Alert`
   - **Icon**: `:rotating_light:`
   - **Message Template**:
   ```json
   {
     "text": "🚨 CRITICAL ALERT - UNS-ClaudeJP",
     "blocks": [
       {
         "type": "header",
         "text": {
           "type": "plain_text",
           "text": "🚨 {{ .GroupLabels.alertname }}"
         }
       },
       {
         "type": "section",
         "fields": [
           {
             "type": "mrkdwn",
             "text": "*Status:*\n{{ .Status }}"
           },
           {
             "type": "mrkdwn",
             "text": "*Severity:*\n{{ .Labels.severity }}"
           },
           {
             "type": "mrkdwn",
             "text": "*Summary:*\n{{ .Annotations.summary }}"
           },
           {
             "type": "mrkdwn",
             "text": "*Time:*\n{{ .StartsAt | humanize }}"
           }
         ]
       },
       {
         "type": "section",
         "text": {
           "type": "mrkdwn",
           "text": "*Description:*\n{{ .Annotations.description }}"
         }
       },
       {
         "type": "actions",
         "elements": [
           {
             "type": "button",
             "text": {
               "type": "plain_text",
               "text": "View in Grafana"
             },
             "url": "{{ .DashboardURL }}"
           },
           {
             "type": "button",
             "text": {
               "type": "plain_text",
               "text": "Silence Alert"
             },
             "url": "{{ .SilenceURL }}"
           }
         ]
       }
     ]
   }
   ```

4. **Alert Routing Configuration**
   ```yaml
   # Grafana notification policies

   # Root policy (default)
   - receiver: Email - Critical Alerts
     group_by: [alertname, cluster, service]
     group_wait: 10s
     group_interval: 5m
     repeat_interval: 4h

   # Critical alerts → Slack + Email
   - matchers:
       - severity = critical
     receiver: Slack - Critical
     continue: true  # Also send to email
     group_wait: 0s
     repeat_interval: 1h

   # Warning alerts → Slack only
   - matchers:
       - severity = warning
     receiver: Slack - Warnings
     group_wait: 30s
     repeat_interval: 6h

   # Payroll alerts → Dedicated channel
   - matchers:
       - service = payroll
     receiver: Slack - Payroll
     group_wait: 10s
     repeat_interval: 2h

   # Database alerts → Dedicated channel
   - matchers:
       - service = database
     receiver: Slack - Database
     group_wait: 30s
     repeat_interval: 4h
   ```

5. **Slack App Enhancements** (Optional - Advanced)
   - **Interactive Buttons**:
     - Acknowledge alert
     - Silence for 1h/4h/24h
     - Assign to team member
     - Mark as resolved
   - **Alert Threading**: Group related alerts in threads
   - **Status Updates**: Post resolution messages
   - **Metrics Snapshots**: Attach relevant graphs

#### Benefits
- ✅ Real-time notifications (< 5 seconds)
- ✅ Rich formatting with context
- ✅ Team collaboration in threads
- ✅ Mobile push notifications
- ✅ Integration with other tools (Jira, PagerDuty)
- ✅ Searchable alert history
- ✅ Easy to @mention team members

#### Best Practices
1. **Channel Hygiene**
   - Keep #monitoring-critical signal-only (no chatter)
   - Use threads for investigation discussions
   - Archive resolved alerts weekly

2. **Alert Fatigue Prevention**
   - Group similar alerts (5-minute window)
   - Suppress duplicate alerts
   - Use smart repeat intervals
   - Regular alert threshold tuning

3. **On-Call Workflow**
   - Acknowledge alerts within 5 minutes
   - Update thread with investigation status
   - Post resolution summary
   - Create incident report for critical issues

---

### Phase 3: Advanced Integrations (Week 4+)

#### 3.1 PagerDuty Integration

**Use Case**: 24/7 on-call rotation for critical production alerts

**Setup**:
1. Create PagerDuty service: "UNS-ClaudeJP Production"
2. Configure escalation policy:
   - Primary: On-call DevOps (5 min timeout)
   - Secondary: Engineering Manager (10 min timeout)
   - Tertiary: IT Director (immediate)
3. Grafana contact point:
   - **Name**: `PagerDuty - Critical`
   - **Integration Key**: `<from PagerDuty>`
   - **Severity**: Critical only

**Benefits**:
- Guaranteed acknowledgment tracking
- Phone call escalation
- SMS notifications
- Integration with incident management
- On-call schedule management

**Cost**: $19/user/month (Standard plan)

---

#### 3.2 Microsoft Teams Integration

**Use Case**: Organizations using Microsoft 365

**Setup**:
1. Create Teams channel: "Monitoring Alerts"
2. Add Incoming Webhook connector
3. Configure Grafana contact point with webhook URL

**Benefits**:
- Native Microsoft ecosystem integration
- Video call integration for incidents
- SharePoint document sharing
- Calendar integration

---

#### 3.3 Custom Webhook Integration

**Use Case**: Integration with custom internal systems

**Potential Integrations**:
- Internal ticketing system
- HR admin dashboard
- Custom escalation logic
- Alert analytics database

**Example Implementation**:
```python
# Custom webhook receiver
from fastapi import FastAPI, Request
import logging

app = FastAPI()

@app.post("/webhook/grafana")
async def receive_alert(request: Request):
    alert = await request.json()

    # Custom logic
    if alert['labels']['severity'] == 'critical':
        # Create ticket in internal system
        create_ticket(alert)

        # Send SMS to on-call engineer
        send_sms(alert)

        # Log to analytics database
        log_alert(alert)

    return {"status": "received"}
```

---

## Alert Classification & Routing

### Severity Levels

#### Critical (🔴)
- **Definition**: Service outage or severe degradation
- **Examples**: Backend down, Database down, Disk full
- **Notification**: Slack + Email + PagerDuty (if configured)
- **Response SLA**: 5 minutes
- **Escalation**: After 15 minutes without acknowledgment

#### Warning (🟡)
- **Definition**: Performance degradation or approaching limits
- **Examples**: High error rate, Slow queries, Low disk space
- **Notification**: Slack + Email (digest)
- **Response SLA**: 30 minutes
- **Escalation**: After 1 hour without acknowledgment

#### Info (🔵)
- **Definition**: Informational or trend alerts
- **Examples**: High traffic, Unusual patterns, Maintenance needed
- **Notification**: Email (daily digest) + Slack (weekly summary)
- **Response SLA**: Best effort
- **Escalation**: None

---

## Alert Grouping Strategy

### By Service
```yaml
# Payroll-related alerts
- service: payroll
  channels: [#payroll-alerts, #monitoring-critical]
  contacts: [HR Admin, DevOps, Email]

# OCR-related alerts
- service: ocr
  channels: [#monitoring-warnings]
  contacts: [DevOps, Email]

# Database-related alerts
- service: database
  channels: [#database-alerts, #monitoring-critical]
  contacts: [DBA, DevOps, Email]
```

### By Severity
```yaml
# Critical - All channels
- severity: critical
  channels: [#monitoring-critical, Slack DM to on-call]
  contacts: [PagerDuty, Email, SMS]

# Warning - Selected channels
- severity: warning
  channels: [#monitoring-warnings]
  contacts: [Slack, Email digest]

# Info - Minimal noise
- severity: info
  channels: [Email daily digest]
  contacts: [Email]
```

---

## Implementation Timeline

### Week 1: Email Foundation
- ✅ Verify SMTP configuration
- ✅ Create email contact points in Grafana
- ✅ Configure notification policies
- ✅ Test critical alert delivery
- ✅ Create email templates
- ✅ Train team on email workflows

### Week 2: Slack Integration
- 🔧 Create Slack workspace channels
- 🔧 Configure incoming webhooks
- 🔧 Set up Grafana Slack contact points
- 🔧 Design message templates
- 🔧 Configure alert routing
- 🔧 Test all severity levels

### Week 3: Refinement & Tuning
- 🔧 Monitor alert volume
- 🔧 Adjust thresholds to reduce noise
- 🔧 Optimize grouping intervals
- 🔧 Create runbooks for common alerts
- 🔧 Train team on response procedures
- 🔧 Document escalation policies

### Week 4: Advanced Features (Optional)
- 🔜 PagerDuty integration (if needed)
- 🔜 Custom webhook endpoints
- 🔜 Alert analytics dashboard
- 🔜 Incident management integration
- 🔜 Automated remediation scripts

---

## Cost Analysis

### Current Infrastructure
- **Grafana**: Open source (free)
- **Prometheus**: Open source (free)
- **Email (Gmail)**: Included in Google Workspace
- **Total**: $0/month

### Proposed Additions

#### Essential (Phase 1-2)
- **Slack** (Free plan):
  - ✅ Unlimited messages
  - ✅ 10,000 message history
  - ✅ 10 app integrations
  - **Cost**: $0/month

#### Recommended (Phase 2+)
- **Slack** (Pro plan):
  - Unlimited message history
  - Unlimited app integrations
  - Advanced security
  - **Cost**: $8.75/user/month × 5 users = $43.75/month

#### Optional (Phase 3)
- **PagerDuty** (Standard):
  - On-call management
  - Incident response
  - Mobile app
  - **Cost**: $19/user/month × 2 on-call = $38/month

### Total Monthly Cost
- **Essential**: $0/month
- **Recommended**: $43.75/month (~$525/year)
- **Optional (with PagerDuty)**: $81.75/month (~$981/year)

**ROI Analysis**:
- Average incident resolution time reduction: 50%
- Prevented downtime value: $1,000+ per hour
- Break-even: First prevented incident

---

## Alert Best Practices

### 1. Alert Fatigue Prevention
```yaml
# Good alert
- alert: DatabaseDown
  expr: pg_up == 0
  for: 1m
  severity: critical
  # Clear, actionable, rare

# Bad alert
- alert: AnySlowQuery
  expr: query_duration > 0.1s
  for: 0s
  severity: critical
  # Noisy, low threshold, too frequent
```

### 2. Actionable Alerts
Every alert should answer:
- ✅ **What** is the problem?
- ✅ **Why** does it matter?
- ✅ **How** can it be fixed?
- ✅ **Who** should respond?

### 3. Alert Documentation
Create runbooks for each alert:
```markdown
# Alert: BackendDown

## Severity: Critical

## What It Means
The FastAPI backend service is not responding to health checks.

## Immediate Actions
1. Check backend container status: `docker ps | grep backend`
2. View recent logs: `docker logs uns-claudejp-600-backend --tail 100`
3. Restart if needed: `docker restart uns-claudejp-600-backend`

## Root Cause Investigation
- Check database connectivity
- Review application logs for exceptions
- Verify environment variables

## Escalation
If not resolved in 15 minutes, contact Engineering Manager.
```

### 4. Alert Hygiene
Weekly maintenance:
- Review alert volume metrics
- Identify noisy alerts (>10 triggers/day)
- Adjust thresholds or conditions
- Remove obsolete alerts
- Update runbooks

---

## Success Metrics

### Quantitative
- **Alert Response Time**: < 5 minutes for critical
- **False Positive Rate**: < 10%
- **Alert Coverage**: > 95% of incidents detected
- **Mean Time to Resolution (MTTR)**: < 30 minutes
- **Notification Delivery**: > 99.9% success rate

### Qualitative
- Team satisfaction with alert quality
- Confidence in monitoring coverage
- Clarity of alert messages
- Effectiveness of escalation
- Incident post-mortem insights

---

## Risk Mitigation

### 1. Notification Delivery Failures
- **Risk**: Alerts not delivered due to service outage
- **Mitigation**:
  - Multiple channels (Email + Slack)
  - Monitor alert delivery metrics
  - Heartbeat checks for notification services

### 2. Alert Fatigue
- **Risk**: Team ignores alerts due to high volume
- **Mitigation**:
  - Strict severity classification
  - Alert grouping and throttling
  - Regular threshold tuning
  - Weekly noise review

### 3. False Positives
- **Risk**: Alerts triggered without real issues
- **Mitigation**:
  - Proper `for` duration in alerts
  - Testing in staging environment
  - Gradual rollout of new alerts
  - Post-mortem for false positives

### 4. Slack Dependency
- **Risk**: Alerts missed if Slack is down
- **Mitigation**:
  - Email as backup channel
  - PagerDuty for critical alerts
  - SMS fallback for on-call

---

## Conclusion

This integration proposal provides a comprehensive, scalable alerting strategy that balances real-time visibility with noise reduction. The phased approach allows for incremental implementation while maintaining operational continuity.

### Immediate Next Steps
1. ✅ Approve budget for Slack Pro plan (~$44/month)
2. 📧 Set up email contact points (Week 1)
3. 💬 Create Slack workspace and channels (Week 2)
4. 📝 Document runbooks for all critical alerts
5. 🎓 Train team on new alert workflows

### Long-term Recommendations
- Evaluate PagerDuty after 3 months of operation
- Implement custom webhooks for internal systems
- Build alert analytics dashboard
- Establish monthly alert review meetings
- Create incident response playbooks

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-19
**Prepared By**: @observability-engineer
**Review Date**: 2025-12-19
**Status**: Pending Approval
