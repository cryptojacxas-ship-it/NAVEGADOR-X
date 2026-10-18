# Security Specification - Opera X

## Data Invariants
- Only `cryptojacxas@gmail.com` can be initially bootstrapped as an admin.
- Users can ONLY modify their own `preferences` and `lastActive`.
- `earnings` should ideally be server-validated, but in this prototype, we'll allow client updates with strict bounds check or just restrict to self.
- VPN Nodes are read-only for public, writeable only by admins.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Attempting to write to `/users/another-uid`.
2. **Admin Escalation**: Attempting to create a document in `/admins/my-uid`.
3. **Data Overwrite**: Attempting to change someone else's earnings.
4. **Invalid State**: Setting VPN status to "exploit-mode".
5. **Schema Poisoning**: Adding a 1MB string to `displayName`.
6. **Unauthorized Read**: Querying all users' emails.
7. **Bypassing Auth**: Accessing `/vpn_nodes` without being signed in (if we want to restrict it, though nodes are usually public info).
8. **Malicious ID**: Using a 2KB string as a `nodeId`.
9. **Timestamp Spoofing**: Setting `lastActive` to a future date manually.
10. **Admin Deletion**: Regular user trying to delete an admin record.
11. **Shadow Fields**: Adding `isPro: true` to a user document where it's not defined.
12. **Insecure List**: Fetching the full admin list as a regular user.

## Implementation Strategy
- Use `isValidId(id)` for all path variables.
- Use `isAdmin()` helper that checks `/admins/$(request.auth.uid)`.
- Use `isOwner(uid)` helper.
