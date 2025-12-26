# n8n-nodes-subsplash

This is an n8n community node package for [Subsplash](https://subsplash.com/). It enables you to upload artwork, manage media items (sermons), and interact with the Subsplash API from your n8n workflows.

Subsplash is a platform for churches and ministries to manage media content, including sermons, podcasts, and other audio/video content.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In n8n, go to **Settings** → **Community Nodes** → **Install** and enter:

```
n8n-nodes-subsplash
```

Or install via npm:

```bash
npm install n8n-nodes-subsplash
```

## Operations

### Subsplash Artwork: Upload & Attach

Upload custom artwork to Subsplash and assign it to an existing media item.

**Operation:**
- **Upload & Assign Artwork** - Complete workflow that:
  1. Creates a source image and obtains a presigned S3 URL
  2. Uploads image bytes to S3 with required headers
  3. Creates typed images (wide, square, banner) from the source
  4. Patches the media item to assign the images
  5. Verifies success via CDN

**Parameters:**
- **Media Item ID** (required) - Target media item UUID
- **Image Binary Property** (default: "data") - Name of binary property containing image
- **Content Type** - PNG or JPEG
- **Image Types to Create** - Select which types to create (wide, square, banner)
- **Title** - Optional title (defaults to filename if available)

### Subsplash Media

Update and manage Subsplash media items (sermons).

**Operation:**
- **Update Media Item** - Update an existing media item with:
  - Title, Subtitle, Description
  - Date
  - Speakers (max 3, formatted as tags)
  - Topics (max 10, formatted as tags)
  - Scriptures (OSIS format, comma-separated)
  - Speaker (direct field)
  - External Audio/Video URLs
  - Auto Publish setting
  - Status (Draft, Published, Unlisted)
  - Images (assign multiple images with types)

**Parameters:**
- **Media Item ID** (required) - Subsplash media item ID to update
- All other fields are optional - only non-empty values are sent to the API

## Credentials

This node requires Subsplash API credentials. You can authenticate using one of two methods:

### Authentication Method 1: Email/Password (v1) - Recommended

Simple authentication using email and password.

**Required Fields:**
- **Base URL** - Default: `https://core.subsplash.com`
- **Email** - Your Subsplash account email
- **Password** - Your Subsplash account password
- **Scope** - Optional, defaults to `app:{APP_KEY}` format
- **App Key** (required) - Your Subsplash app key (e.g., "2T3DTM", "9XTSHD")

### Authentication Method 2: ROPC with Client Credentials (v2)

Resource Owner Password Credentials flow with OAuth client credentials.

**Required Fields:**
- **Base URL** - Default: `https://core.subsplash.com`
- **Client ID** - OAuth client ID
- **Client Secret** - OAuth client secret
- **Username (Email)** - Your Subsplash account email
- **Password** - Your Subsplash account password
- **Scope** - Default: `media:read media:write live:write`
- **App Key** (required) - Your Subsplash app key

### Getting Your Credentials

1. **App Key**: Found in your Subsplash dashboard settings
2. **OAuth Credentials** (for v2): Contact Subsplash support or check your developer dashboard
3. **Email/Password**: Your Subsplash account credentials

### Token Management

- Tokens are automatically obtained via OAuth
- Tokens are cached with automatic refresh (30-second buffer before expiry)
- No manual token management required

## Compatibility

- **Minimum n8n version**: 1.0+
- **n8n API version**: 1
- **Node.js**: v22 or higher (for development)

## Usage

### Example: Upload Artwork to Media Item

1. Add a **Subsplash Artwork: Upload & Attach** node to your workflow
2. Configure credentials (see [Credentials](#credentials) above)
3. Set the **Media Item ID** of the target sermon/media item
4. Provide image binary data (from file, URL, or previous node)
5. Select which image types to create (wide, square, banner)
6. Execute the workflow

The node will:
- Upload the image to Subsplash
- Create the specified image types
- Assign them to the media item
- Return the created image IDs and verification status

### Example: Update Media Item

1. Add a **Subsplash Media** node to your workflow
2. Configure credentials
3. Set the **Media Item ID** to update
4. Fill in any fields you want to update (title, speakers, topics, etc.)
5. Execute the workflow

**Note:** Only fields with values will be sent to the API. Empty fields are ignored.

### Example: Update with Speakers and Topics

Speakers and topics are automatically formatted as tags:
- Speakers: `speaker:John Doe` (max 3)
- Topics: `topic:Faith` (max 10)

Enter comma-separated values:
- **Speakers**: `John Doe, Jane Smith`
- **Topics**: `Faith, Hope, Love`

### Example: Update with Scriptures

Enter OSIS format references, comma-separated:
- **Scriptures**: `Gen.1.1,John.3.16,1Cor.13.1`

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Subsplash Developer Documentation](https://developer.subsplash.com)
- [n8n Node Documentation](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Community Forum](https://community.n8n.io/)

## Development

### Prerequisites

- Node.js v22 or higher
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Known Limitations

- Image uploads require valid binary data
- Presigned URLs expire quickly - used immediately after creation
- Speaker tags limited to 3, topic tags limited to 10
- Some fields may require specific formats (e.g., OSIS for scriptures)

## Error Handling

The nodes include comprehensive error handling:

- **S3 Upload Errors**: Marked as `S3UploadError` with endpoint and status details
- **Partial Success**: For artwork uploads, partial successes are collected if some image types fail
- **Error Messages**: Include endpoint, HTTP status, and response body snippets (≤1KB)
- **Continue on Fail**: Supported for batch operations

## Security

- All credentials are stored securely by n8n
- Bearer tokens are handled via OAuth with automatic refresh
- No sensitive data is logged verbatim
- Passwords are masked in the UI

## Version History

### 0.1.0

- Initial release
- Subsplash Artwork: Upload & Attach node
- Subsplash Media: Update Media Item operation
- Support for both Email/Password (v1) and ROPC (v2) authentication
- Full MediaItem field support

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[MIT](LICENSE.md)
