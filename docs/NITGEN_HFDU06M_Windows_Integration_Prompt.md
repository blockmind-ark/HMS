# OpenCode Prompt — Integrate NITGEN HFDU06M on Windows

You are working inside an *existing, large Next.js/React Clinic Management System. It already has doctor, reception, pharmacy, and other portals; patient records; an existing fingerprint/thumb-capture button in the UI; and established patient lookup/fetch mechanisms. Your task is **only to integrate the NITGEN HFDU06M fingerprint device with the existing system on Windows*. Do not rebuild the application or replace its workflows.

## Non-negotiable workflow

1. Inspect the repository first: read README, package manifests, environment examples, architecture notes, existing patient lookup code, the existing capture button/component, API routes, authentication/authorization, and current error/loading patterns.
2. Map the current flow from the existing capture button to the patient-fetch mechanism. Reuse it. Do not add a second button, redesign portals, change unrelated UI, or duplicate patient lookup logic.
3. Before coding, report a concise integration plan and identify the exact files/modules you intend to change. Then implement the smallest safe change.
4. Preserve the existing framework, package manager, conventions, lint/type-check/test commands, and database schema unless a change is genuinely required and justified.
5. Never invent NITGEN SDK APIs, library names, device IDs, commands, or compatibility claims. Verify the exact HFDU06M/Hamster model, supported Windows versions/architecture, USB vendor/product IDs, SDK/license availability, and installation instructions from official vendor documentation or files already supplied. If the SDK or documentation is absent, clearly identify the blocker and create a narrow adapter interface plus a documented stub/test double; do not pretend real device capture works.
6. Do not transmit raw fingerprint images/templates to the browser or general-purpose logs. Follow the system’s existing security and privacy controls; minimize biometric data handling.

## Target architecture

- Keep the existing Next.js frontend and its capture button.
- Add a Windows-specific *local biometric bridge/service* only if required by the confirmed NITGEN Windows SDK. Prefer the smallest maintainable implementation compatible with the actual SDK; do not assume Node.js can directly call a native SDK.
- Define a stable, typed interface between the existing app and the local bridge. Reuse the project's existing API/client conventions where appropriate.
- The local bridge should bind only to loopback (127.0.0.1), reject cross-origin requests except explicitly configured trusted origins, validate inputs, apply timeouts, and return structured errors. Do not expose a biometric service to the LAN or public internet.
- Keep device-specific operations behind an adapter using the same contract intended for the Ubuntu implementation. The frontend and patient portals must not need OS-specific branching.
- Reuse the existing patient identification/fetch mechanism. The device integration should return only the minimum result needed by that mechanism, such as a verified match/reference or capture status—not a new parallel patient workflow.
- Do not store biometric templates in browser storage, logs, or plain-text files. If the existing application already has a secure, approved template-storage and matching flow, integrate with it rather than creating a competing database.

## Required implementation steps

### A. Discovery and compatibility
- Inspect the repository and determine how the app is hosted on the target Windows client: local development, packaged desktop environment, or remote web server. This affects whether a loopback bridge is reachable from the browser.
- Verify the exact official Windows driver/SDK package for HFDU06M, supported Windows versions/architectures, installation steps, and redistribution/licensing restrictions.
- Confirm whether the SDK supports capture, enrollment, and/or matching; do not assume all functions are available.
- Verify USB enumeration and device availability using documented vendor or OS tools. Do not assume an SDK can be called directly from browser JavaScript.
- Document prerequisites. Do not install drivers, execute installers, or run elevated commands without explaining them first.

### B. Integration
- Add a small Windows adapter/bridge with clear interfaces such as getDeviceStatus, captureFingerprint, and, only if the SDK supports it, matchFingerprint or enrollFingerprint.
- Use the SDK's actual supported language/runtime and lifecycle. If it is a native DLL or a .NET SDK, choose an appropriate bridge (for example, a supported .NET local service) rather than forcing unsupported direct Node.js bindings.
- Connect the existing capture button to the existing patient lookup flow through the shared contract.
- Keep enrollment and identification separate if the current product already distinguishes them. Never silently enroll a patient during identification.
- Configure the bridge to start and stop reliably and document whether it runs as a user process or Windows service; choose the least-privileged option compatible with the SDK.
- Use configuration/environment variables for local service URL and allowed origin; validate configuration and provide safe defaults.
- Provide a mock adapter for automated tests, but make mock mode explicit and visibly distinguishable from real hardware mode.

### C. Security and privacy
- Preserve login, role/portal permissions, CSRF protections where relevant, and server-side authorization.
- Validate every request and response. Avoid putting biometric payloads in URLs, analytics, crash reports, or logs.
- Use a short-lived request/session token or another appropriate local-bridge protection mechanism; do not rely on CORS alone as authentication.
- Account for browser mixed-content restrictions, HTTPS-to-loopback behavior, origin checks, and local-service authentication. Verify the intended deployment rather than disabling browser security.
- Explain the consent, retention, deletion, encryption, and access-control implications of any biometric data that the existing system stores.
- Do not change production patient records or run migrations without explicit approval.

### D. Tests and documentation
- Add unit tests for adapter behavior and error handling, plus integration tests for the existing button-to-patient-fetch flow using a mock device.
- Test unavailable device, permission failure, unsupported SDK, timeout, malformed response, no match, multiple/ambiguous matches, and service not running.
- Run available lint, type-check, and tests. Report commands and actual outcomes; do not claim tests passed unless they ran successfully.
- Add a Windows setup guide with verified prerequisites, driver/SDK installation steps, bridge start/stop, configuration, troubleshooting, and uninstall/rollback.
- Document what remains unverified until the physical HFDU06M device is tested.

## Acceptance criteria

- Existing portals and patient workflows remain intact.
- The existing capture button triggers the real device through the Windows bridge when the official compatible SDK is installed.
- A successful device result flows into the *existing* patient lookup mechanism.
- No-match, device failure, and unsupported-SDK cases show clear errors without corrupting patient records.
- The bridge uses the same contract as the Ubuntu implementation so the shared Next.js application needs no duplicated OS-specific UI logic.
- No fake success, fabricated SDK calls, unrelated refactor, or unapproved data/schema change.

## Final report

When finished, summarize:
1. Existing flow discovered.
2. Files changed and why.
3. Verified HFDU06M driver/SDK compatibility and evidence.
4. How to install/start the Windows bridge and configure the existing app.
5. Tests actually run and their results.
6. Hardware checks still required and any blockers.

Start by inspecting the repository. Do not assume the device SDK is installed or available.

