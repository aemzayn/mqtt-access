# Security Policy

## Supported Versions

Security updates are currently provided for:
- 1.0.x

Older versions may not receive fixes.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately.

Preferred channels:
1. GitHub Security Advisories (private):
   https://github.com/aemzayn/mqtt-access/security/advisories/new
2. If advisories are unavailable, open a private maintainer contact request via
   the repository issue tracker and avoid posting exploit details publicly.

Please include:
- A clear description of the issue and impact.
- Affected version(s) and environment details.
- Reproduction steps or proof of concept.
- Any suggested mitigation.

## Response Expectations

Target process:
- Acknowledgment within 7 days.
- Triage and severity assessment after acknowledgment.
- Coordinated fix and disclosure timeline based on impact.

## Scope Notes

This application is a desktop MQTT client. Security findings may involve:
- Credential handling and storage.
- TLS/certificate validation behavior.
- Message parsing and UI rendering of untrusted payloads.
- Dependency vulnerabilities in Go and frontend packages.

Please do not use public issues for unpatched security reports.
