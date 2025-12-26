# OpenAPI Spec Comparison

This document compares our implementation with the official Subsplash OpenAPI specification to ensure compliance.

## Summary of Changes Made

### ✅ Fixed Issues

1. **Status Enum** - Updated to match OpenAPI spec:
   - **Before**: `draft`, `published`, `unlisted`
   - **After**: `draft`, `scheduled`, `published`
   - **Note**: "unlisted" is a filter option, not a status value

2. **Images Array Limit** - Added validation:
   - OpenAPI specifies `maxItems: 3` for `_embedded.images`
   - Added validation to enforce this limit

3. **Field Length Validations** - Added per OpenAPI spec:
   - `title`: maxLength 100
   - `subtitle`: maxLength 100
   - `speaker`: maxLength 200
   - `external_audio_url`: maxLength 1024
   - `external_video_url`: maxLength 1024

## MediaItem Schema Compliance

### Fields We Support (Matching OpenAPI)

| Field | OpenAPI Type | Our Implementation | Status |
|-------|-------------|-------------------|--------|
| `id` | uuid | ✅ Used in requests | ✅ |
| `app_key` | string (pattern: `^[A-Z0-9]{6}$`) | ✅ Required in requests | ✅ |
| `title` | string (maxLength: 100) | ✅ With validation | ✅ |
| `subtitle` | string (maxLength: 100) | ✅ With validation | ✅ |
| `summary` | string | ✅ Mapped from `description` | ✅ |
| `date` | date-time | ✅ | ✅ |
| `speaker` | string (maxLength: 200) | ✅ With validation | ✅ |
| `tags` | array of strings | ✅ Formatted as `type:value` | ✅ |
| `scriptures` | array of strings | ✅ | ✅ |
| `external_audio_url` | string (maxLength: 1024) | ✅ With validation | ✅ |
| `external_video_url` | string (maxLength: 1024) | ✅ With validation | ✅ |
| `auto_publish` | boolean | ✅ | ✅ |
| `status` | enum: draft/scheduled/published | ✅ Fixed to match | ✅ |
| `_embedded.images` | array (maxItems: 3) | ✅ With validation | ✅ |

### Fields in OpenAPI We Don't Currently Support

These are available in the OpenAPI spec but not exposed in our UI (can be added if needed):

- `additional_label` (string, maxLength: 800)
- `external_id` (string, pattern: `^[a-z0-9]{100}$`)
- `external_m3u8_url` (string, maxLength: 1024)
- `outline_button_title` (string, maxLength: 200)
- `outline_button_url` (string, maxLength: 200)
- `podcast_guid` (string, maxLength: 100)
- `position` (integer, minimum: 0)
- `published_at` (date-time, readOnly)
- `short_code` (string, pattern: `^[a-z0-9]{7}$`)
- `slug` (string, maxLength: 100, pattern: `^[a-z0-9-]{1,100}$`)
- `web_video_button_title` (string, maxLength: 200)
- `web_video_button_url` (string, maxLength: 1024)
- `website_button_title` (string, maxLength: 1024)
- `website_button_url` (string, maxLength: 1024)
- `_embedded.audio` (object)
- `_embedded.broadcast` (object)
- `_embedded.document` (object)
- `_embedded.video` (object)
- `_embedded.media-series` (object)
- `_embedded.restriction` (object)

## API Endpoints

### Media Items Endpoints

| Endpoint | Method | Our Implementation | Status |
|----------|--------|-------------------|--------|
| `/media/v1/media-items` | GET | ✅ Used in credentials test | ✅ |
| `/media/v1/media-items` | POST | ❌ Not implemented | ⚠️ |
| `/media/v1/media-items/{id}` | GET | ❌ Not implemented | ⚠️ |
| `/media/v1/media-items/{id}` | PATCH | ✅ Implemented | ✅ |
| `/media/v1/media-items/{id}` | DELETE | ❌ Not implemented | ⚠️ |

### Image/File Endpoints

| Endpoint | Method | Our Implementation | Status |
|----------|--------|-------------------|--------|
| `/files/v1/images` | POST (source) | ✅ Implemented in Artwork node | ✅ |
| `/files/v1/images` | POST (typed) | ✅ Implemented in Artwork node | ✅ |
| S3 Presigned Upload | PUT | ✅ Implemented | ✅ |

## Request/Response Format

### Request Body Structure

Our implementation correctly uses:
- ✅ `application/vnd.api+json` Content-Type
- ✅ `application/vnd.api+json` Accept header
- ✅ Snake_case field names (`app_key`, `external_audio_url`, etc.)
- ✅ `_embedded` structure for related resources
- ✅ Only non-empty fields included in PATCH requests

### Response Handling

- ✅ Handles HAL+JSON format
- ✅ Extracts `_embedded` resources correctly
- ✅ Proper error handling with status codes

## Validation Rules

### Implemented Validations

1. **Images**: Maximum 3 images per media item
2. **Speakers**: Maximum 3 speakers (as tags)
3. **Topics**: Maximum 10 topics (as tags)
4. **Field Lengths**: All string fields validated against maxLength
5. **Status**: Only valid enum values accepted

### Tag Format

Tags follow the OpenAPI spec format: `{type}:{value}`
- ✅ `speaker:John Doe`
- ✅ `topic:Faith and Works`

## Recommendations

### High Priority
- ✅ **DONE**: Fix status enum to remove "unlisted"
- ✅ **DONE**: Add images array limit validation
- ✅ **DONE**: Add field length validations

### Medium Priority (Future Enhancements)
- Consider adding GET operation for media items
- Consider adding POST operation for creating media items
- Consider adding DELETE operation
- Add support for additional fields if needed by users

### Low Priority
- Add support for `_embedded.audio`, `_embedded.video`, etc. if needed
- Add support for media series relationships
- Add support for broadcast resources

## Notes

1. **Unlisted Resources**: The OpenAPI spec shows `filter[unlisted]` as a query parameter for filtering, not as a status value. Our implementation correctly uses `draft`, `scheduled`, and `published` as status values.

2. **Images**: The OpenAPI spec shows `_embedded.images` as an array with `maxItems: 3`. Our implementation correctly enforces this limit.

3. **Field Names**: All field names in our requests match the OpenAPI spec exactly (snake_case).

4. **Content Types**: We correctly use `application/vnd.api+json` for both request and response content types.

## Conclusion

Our implementation is now compliant with the official Subsplash OpenAPI specification. The main changes were:
- Fixed status enum values
- Added images array limit validation
- Added field length validations

All core functionality matches the OpenAPI spec, and we follow the same request/response patterns.

