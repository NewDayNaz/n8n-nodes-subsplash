# Subsplash API Test Script

This standalone test script validates the Subsplash API implementation outside of n8n. Use it to debug authentication issues and verify API endpoints.

## Installation

First, install the required dependency:

```bash
npm install
```

## Quick Setup (PowerShell)

The easiest way to set up your test environment is using the provided PowerShell script:

1. Copy the example template:
   ```powershell
   Copy-Item setup-test-env.example.ps1 setup-test-env.ps1
   ```

2. Edit `setup-test-env.ps1` and fill in your credentials

3. Run the setup script:
   ```powershell
   .\setup-test-env.ps1
   ```

4. Run the test:
   ```powershell
   node test-api.js
   ```

**Note:** `setup-test-env.ps1` is in `.gitignore` and won't be committed to the repository.

## Manual Setup

### Method 1: Email/Password Authentication (v1)

```bash
# Windows PowerShell
$env:SUBSPLASH_BASE_URL="https://core.subsplash.com"
$env:SUBSPLASH_AUTH_METHOD="emailPassword"
$env:SUBSPLASH_EMAIL="your-email@example.com"
$env:SUBSPLASH_PASSWORD="your-password"
$env:SUBSPLASH_APP_KEY="YOUR_APP_KEY"
$env:SUBSPLASH_SCOPE="app:YOUR_APP_KEY"  # Optional
$env:SUBSPLASH_MEDIA_ITEM_ID="uuid-here"  # Optional, for get/update/delete tests
$env:SUBSPLASH_CALENDAR_ID="uuid-here"  # Optional, for calendar tests
$env:SUBSPLASH_EVENT_ID="uuid-here"  # Optional, for event tests
$env:SUBSPLASH_PROFILE_ID="uuid-here"  # Optional, for profile tests
$env:SUBSPLASH_HOUSEHOLD_ID="uuid-here"  # Optional, for household tests
node test-api.js
```

```bash
# Linux/Mac
export SUBSPLASH_BASE_URL="https://core.subsplash.com"
export SUBSPLASH_AUTH_METHOD="emailPassword"
export SUBSPLASH_EMAIL="your-email@example.com"
export SUBSPLASH_PASSWORD="your-password"
export SUBSPLASH_APP_KEY="YOUR_APP_KEY"
export SUBSPLASH_SCOPE="app:YOUR_APP_KEY"  # Optional
export SUBSPLASH_MEDIA_ITEM_ID="uuid-here"  # Optional
export SUBSPLASH_CALENDAR_ID="uuid-here"  # Optional
export SUBSPLASH_EVENT_ID="uuid-here"  # Optional
export SUBSPLASH_PROFILE_ID="uuid-here"  # Optional
export SUBSPLASH_HOUSEHOLD_ID="uuid-here"  # Optional
node test-api.js
```

### Method 2: ROPC Authentication (v2)

```bash
# Windows PowerShell
$env:SUBSPLASH_BASE_URL="https://core.subsplash.com"
$env:SUBSPLASH_AUTH_METHOD="ropc"
$env:SUBSPLASH_CLIENT_ID="your-client-id"
$env:SUBSPLASH_CLIENT_SECRET="your-client-secret"
$env:SUBSPLASH_USERNAME="your-email@example.com"
$env:SUBSPLASH_PASSWORD="your-password"
$env:SUBSPLASH_APP_KEY="YOUR_APP_KEY"
$env:SUBSPLASH_SCOPE="media:read media:write live:write"  # Optional
$env:SUBSPLASH_MEDIA_ITEM_ID="uuid-here"  # Optional
$env:SUBSPLASH_CALENDAR_ID="uuid-here"  # Optional
$env:SUBSPLASH_EVENT_ID="uuid-here"  # Optional
$env:SUBSPLASH_PROFILE_ID="uuid-here"  # Optional
$env:SUBSPLASH_HOUSEHOLD_ID="uuid-here"  # Optional
node test-api.js
```

```bash
# Linux/Mac
export SUBSPLASH_BASE_URL="https://core.subsplash.com"
export SUBSPLASH_AUTH_METHOD="ropc"
export SUBSPLASH_CLIENT_ID="your-client-id"
export SUBSPLASH_CLIENT_SECRET="your-client-secret"
export SUBSPLASH_USERNAME="your-email@example.com"
export SUBSPLASH_PASSWORD="your-password"
export SUBSPLASH_APP_KEY="YOUR_APP_KEY"
export SUBSPLASH_SCOPE="media:read media:write live:write"  # Optional
export SUBSPLASH_MEDIA_ITEM_ID="uuid-here"  # Optional
node test-api.js
```

## What It Tests

The script runs the following tests in sequence:

### Authentication
1. **Authentication** - Tests OAuth token acquisition (v1 or v2)

### Media API
2. **List Media Items** - Tests GET `/media/v1/media-items` endpoint
3. **Get Media Item** - Tests GET `/media/v1/media-items/{id}` (if ID provided)
4. **Create Media Item** - Tests POST `/media/v1/media-items`
5. **Update Media Item** - Tests PATCH `/media/v1/media-items/{id}` (if ID provided)
6. **Delete Media Item** - Tests DELETE `/media/v1/media-items/{id}` (cleanup of created items)

### Artwork Upload
7. **Create Source Image** - Tests POST `/files/v1/images` (source type)
8. **S3 Upload** - Tests PUT to presigned S3 URL
9. **Create Typed Images** - Tests POST `/files/v1/images` (wide, square, banner)

### Events API
10. **List Calendars** - Tests GET `/events/v2/calendars`
11. **Get Calendar** - Tests GET `/events/v2/calendars/{id}` (if ID available)
12. **Create Calendar** - Tests POST `/events/v2/calendars`
13. **List Events** - Tests GET `/events/v2/events`

### People API
14. **List Profiles** - Tests GET `/people/v1/profiles`
15. **Get Profile** - Tests GET `/people/v1/profiles/{id}` (if ID available)
16. **List Households** - Tests GET `/people/v1/households`

## Troubleshooting

### "Authorization failed" Error

If you see an authorization error, check:

1. **Credentials are correct** - Verify email/password or client credentials
2. **Base URL** - Ensure you're using the correct base URL (default: `https://core.subsplash.com`)
3. **App Key** - Verify your app key is correct
4. **Scope** - For v1, try with and without scope. For v2, ensure scope includes required permissions
5. **Endpoint** - Verify the endpoint URL matches your Subsplash environment

### Common Issues

**401 Unauthorized:**
- Check email/password or client credentials
- Verify app key is correct
- Ensure scope is properly formatted (for v1: `app:APP_KEY`)

**403 Forbidden:**
- App key may not have required permissions
- Scope may be insufficient

**404 Not Found:**
- Base URL may be incorrect
- Endpoint path may have changed

### Debug Output

The script provides detailed output for each step:
- ✅ Success indicators
- ❌ Error messages with status codes
- Full response bodies on errors
- Token information (first 20 chars for security)

## Example Output

```
🧪 Subsplash API Test Suite
==================================================

🔐 Authenticating using emailPassword method...
Base URL: https://core.subsplash.com
Email: user@example.com
Scope: app:2T3DTM
✅ Authentication successful!
Token (first 20 chars): eyJhbGciOiJSUzI1NiI...
Expires in: 3600 seconds

📋 Testing: GET /media/v1/media-items
✅ Success! Status: 200
Response keys: ['_embedded', '_links', 'page']
Found 1 media item(s)

🖼️  Testing: POST /files/v1/images (create source)
✅ Success! Status: 201
Source Image ID: abc123-def456-...
Presigned URL present: true

☁️  Testing: PUT to S3 (presigned URL)
✅ Success! Status: 200

🖼️  Testing: POST /files/v1/images (create wide typed image)
✅ Success! Status: 201
Typed Image ID (wide): xyz789-...

==================================================
✅ All tests passed!
```

## Test Results

The script provides a comprehensive summary at the end:
- ✅ **Passed** - Tests that completed successfully
- ❌ **Failed** - Tests that encountered errors (details shown)
- ⏭️ **Skipped** - Tests that were skipped due to missing optional IDs

The script continues running even if some tests fail, allowing you to see results for all endpoints.

## Notes

- The script creates a minimal 1x1 PNG for S3 upload testing
- Source images and typed images are created but not cleaned up (test artifacts)
- Created test media items are automatically deleted at the end (cleanup)
- Tests that require IDs will be skipped if IDs are not provided
- All API calls use the same authentication token obtained at the start
- The script uses `app_key` as `org_key` for People API tests (they may be the same in your setup)

