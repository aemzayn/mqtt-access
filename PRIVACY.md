# Privacy Policy

Effective date: 2026-07-18

MQTT Access is a local desktop application. This policy explains what data the
application handles and how.

## 1. Summary

- No built-in analytics or telemetry are sent by default.
- The app connects only to MQTT brokers you configure.
- Data persistence is local on your device.

## 2. Data processed by the app

The app may process:
- Connection settings you enter (host, port, protocol, subscriptions, optional
  username/password, optional TLS paths).
- MQTT messages received from brokers you connect to.
- UI state such as window layout and app settings.

## 3. Local storage

The app stores selected configuration data in your user config directory under
an app-specific folder.

Typical stored files include:
- connections.json
- layout.json
- settings.json

Message payload data is kept in memory while the app is running (subject to
per-topic history limits) and is not intended to be permanently stored by
default.

## 4. Network activity

The app initiates network communication only to brokers/endpoints you configure
(`mqtt`, `mqtts`, `ws`, `wss`) and does not require a central cloud service.

## 5. Third-party components

The app uses open-source libraries and runtime components (for example, Go,
Wails, React, and MQTT libraries) which may have their own licenses and terms.
See THIRD_PARTY_NOTICES.md.

## 6. Your responsibilities

You are responsible for:
- Broker access control and authentication setup.
- Proper handling of credentials and certificates.
- Compliance with laws and policies applicable to your data.

## 7. Changes to this policy

This policy may be updated over time. Updates should be documented in the
project changelog.

## 8. Contact

Repository and issue tracker:
https://github.com/aemzayn/mqtt-access
