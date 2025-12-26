# Subsplash API Test Environment Setup - EXAMPLE TEMPLATE
# Copy this file to setup-test-env.ps1 and fill in your credentials
# 
# Usage: .\setup-test-env.ps1
# Then run: node test-api.js

# ============================================
# CONFIGURE YOUR CREDENTIALS BELOW
# ============================================

# Base URL (optional, defaults to https://core.subsplash.com)
$env:SUBSPLASH_BASE_URL = "https://core.subsplash.com"

# Authentication Method: "emailPassword" or "ropc"
$env:SUBSPLASH_AUTH_METHOD = "emailPassword"

# For Email/Password Authentication (v1)
$env:SUBSPLASH_EMAIL = "your-email@example.com"
$env:SUBSPLASH_PASSWORD = "your-password"

# For ROPC Authentication (v2) - uncomment and fill if using ROPC
# $env:SUBSPLASH_CLIENT_ID = "your-client-id"
# $env:SUBSPLASH_CLIENT_SECRET = "your-client-secret"
# $env:SUBSPLASH_USERNAME = "your-email@example.com"

# App Key (required)
$env:SUBSPLASH_APP_KEY = "YOUR_APP_KEY"

# Org Key (optional, for People API - defaults to App Key if not provided)
# Org Key is typically 8 characters (e.g., "SUBSPLSH")
$env:SUBSPLASH_ORG_KEY = ""

# Scope (optional)
# For v1: usually "app:YOUR_APP_KEY" or leave empty
# For v2: usually "media:read media:write live:write"
$env:SUBSPLASH_SCOPE = ""

# Media Item ID (optional, for testing get/update/delete operations)
$env:SUBSPLASH_MEDIA_ITEM_ID = ""

# Calendar ID (optional, for testing calendar operations)
$env:SUBSPLASH_CALENDAR_ID = ""

# Event ID (optional, for testing event operations)
$env:SUBSPLASH_EVENT_ID = ""

# Profile ID (optional, for testing profile operations)
$env:SUBSPLASH_PROFILE_ID = ""

# Household ID (optional, for testing household operations)
$env:SUBSPLASH_HOUSEHOLD_ID = ""

# ============================================
# DO NOT EDIT BELOW THIS LINE
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Subsplash API Test Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate required variables
$errors = @()

if ([string]::IsNullOrWhiteSpace($env:SUBSPLASH_APP_KEY) -or $env:SUBSPLASH_APP_KEY -eq "YOUR_APP_KEY") {
    $errors += "SUBSPLASH_APP_KEY is required"
}

if ($env:SUBSPLASH_AUTH_METHOD -eq "emailPassword") {
    if ([string]::IsNullOrWhiteSpace($env:SUBSPLASH_EMAIL) -or $env:SUBSPLASH_EMAIL -eq "your-email@example.com") {
        $errors += "SUBSPLASH_EMAIL is required for emailPassword authentication"
    }
    if ([string]::IsNullOrWhiteSpace($env:SUBSPLASH_PASSWORD) -or $env:SUBSPLASH_PASSWORD -eq "your-password") {
        $errors += "SUBSPLASH_PASSWORD is required for emailPassword authentication"
    }
} elseif ($env:SUBSPLASH_AUTH_METHOD -eq "ropc") {
    if ([string]::IsNullOrWhiteSpace($env:SUBSPLASH_CLIENT_ID) -or $env:SUBSPLASH_CLIENT_ID -eq "your-client-id") {
        $errors += "SUBSPLASH_CLIENT_ID is required for ROPC authentication"
    }
    if ([string]::IsNullOrWhiteSpace($env:SUBSPLASH_CLIENT_SECRET) -or $env:SUBSPLASH_CLIENT_SECRET -eq "your-client-secret") {
        $errors += "SUBSPLASH_CLIENT_SECRET is required for ROPC authentication"
    }
    if ([string]::IsNullOrWhiteSpace($env:SUBSPLASH_USERNAME) -or $env:SUBSPLASH_USERNAME -eq "your-email@example.com") {
        $errors += "SUBSPLASH_USERNAME is required for ROPC authentication"
    }
    if ([string]::IsNullOrWhiteSpace($env:SUBSPLASH_PASSWORD) -or $env:SUBSPLASH_PASSWORD -eq "your-password") {
        $errors += "SUBSPLASH_PASSWORD is required for ROPC authentication"
    }
} else {
    $errors += "SUBSPLASH_AUTH_METHOD must be 'emailPassword' or 'ropc'"
}

if ($errors.Count -gt 0) {
    Write-Host "❌ Configuration Errors:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   - $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please edit this script and fill in your credentials." -ForegroundColor Yellow
    exit 1
}

# Display configuration (masking sensitive values)
Write-Host "Configuration:" -ForegroundColor Green
Write-Host "  Base URL: $($env:SUBSPLASH_BASE_URL)" -ForegroundColor Gray
Write-Host "  Auth Method: $($env:SUBSPLASH_AUTH_METHOD)" -ForegroundColor Gray
Write-Host "  App Key: $($env:SUBSPLASH_APP_KEY)" -ForegroundColor Gray

if ($env:SUBSPLASH_AUTH_METHOD -eq "emailPassword") {
    Write-Host "  Email: $($env:SUBSPLASH_EMAIL)" -ForegroundColor Gray
    Write-Host "  Password: [HIDDEN]" -ForegroundColor Gray
} else {
    Write-Host "  Client ID: $($env:SUBSPLASH_CLIENT_ID)" -ForegroundColor Gray
    Write-Host "  Username: $($env:SUBSPLASH_USERNAME)" -ForegroundColor Gray
    Write-Host "  Password: [HIDDEN]" -ForegroundColor Gray
}

if (-not [string]::IsNullOrWhiteSpace($env:SUBSPLASH_SCOPE)) {
    Write-Host "  Scope: $($env:SUBSPLASH_SCOPE)" -ForegroundColor Gray
}

if (-not [string]::IsNullOrWhiteSpace($env:SUBSPLASH_MEDIA_ITEM_ID)) {
    Write-Host "  Media Item ID: $($env:SUBSPLASH_MEDIA_ITEM_ID)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Environment variables set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run:" -ForegroundColor Cyan
Write-Host "  node test-api.js" -ForegroundColor White
Write-Host ""
Write-Host "Note: These environment variables are only set for this PowerShell session." -ForegroundColor Yellow
Write-Host "      They will be cleared when you close this window." -ForegroundColor Yellow

