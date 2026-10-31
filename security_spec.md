# Security Specification for StudiRad Firestore

## 1. Data Invariants
1. `opportunities`: Publicly readable by authenticated or unauthenticated users for discovery; modifications strictly restricted to administrative accounts or system.
2. `classes`: Publicly readable; create/update/delete restricted to administrators or instructors.
3. `webinars`: Publicly readable; modification restricted to administrators.
4. `users/{userId}`: Strict owner-only access (`request.auth.uid == userId`). PII is isolated to the user's own document.
5. `users/{userId}/completedClasses/{classId}`: Modifiable only by the authenticated owner of the document (`request.auth.uid == userId`).

## 2. The "Dirty Dozen" Payloads (Testing Attack Vectors)
1. **Unauthenticated Profile Hijack**: Attempt to write to `/users/victim_123` with no `request.auth`. Expected: `PERMISSION_DENIED`.
2. **Cross-User Profile Tamper**: User `attacker_456` attempting to update `/users/victim_123` `role` or `fullName`. Expected: `PERMISSION_DENIED`.
3. **Ghost Field Injection in User**: Injecting `isAdmin: true` into `/users/{uid}`. Expected: `PERMISSION_DENIED`.
4. **Oversized String Attack**: Submitting 100KB payload into `fullName`. Expected: `PERMISSION_DENIED`.
5. **Path Traversal / Malicious ID**: Injecting document ID with symbols like `../admins/bypass`. Expected: `PERMISSION_DENIED` via `isValidId`.
6. **Public Opportunity Spoofing**: Regular non-admin user trying to create an unverified fake job in `/opportunities`. Expected: `PERMISSION_DENIED`.
7. **Opportunity Delete Tamper**: Non-admin user sending DELETE to `/opportunities/opp_101`. Expected: `PERMISSION_DENIED`.
8. **Webinar Manipulation**: Non-admin user updating `/webinars/webinar_ai_triage` view count or title. Expected: `PERMISSION_DENIED`.
9. **Fake Class Completion Forgery**: User `attacker` writing to `/users/victim/completedClasses/class_999`. Expected: `PERMISSION_DENIED`.
10. **Unauthenticated List of User Profiles**: Anonymous or guest query listing `/users` collection without filtering by their own UID. Expected: `PERMISSION_DENIED`.
11. **Immortal Field Overwrite**: Attempting to mutate `createdAt` or identity keys during update. Expected: `PERMISSION_DENIED`.
12. **Negative CPD Points Attack**: Submitting invalid types or negative numbers to `cpdCredits`. Expected: `PERMISSION_DENIED`.
