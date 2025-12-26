# n8n-nodes-subsplash

This is an n8n community node package for [Subsplash](https://subsplash.com/). It enables you to manage media items, upload artwork, manage events and calendars, and interact with profiles and households through the Subsplash API from your n8n workflows.

Subsplash is a platform for churches and ministries to manage media content, including sermons, podcasts, events, and other audio/video content.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Table of Contents

- [Installation](#installation)
- [Nodes](#nodes)
  - [Subsplash Artwork](#subsplash-artwork)
  - [Subsplash Media](#subsplash-media)
  - [Subsplash Events](#subsplash-events)
  - [Subsplash People](#subsplash-people)
- [Credentials](#credentials)
- [Usage Examples](#usage-examples)
- [Compatibility](#compatibility)
- [Resources](#resources)

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

## Nodes

This package includes four nodes for interacting with the Subsplash API:

### Subsplash Artwork

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

Manage Subsplash media items (sermons, podcasts, etc.) with full CRUD operations.

**Operations:**
- **Create** - Create a new media item
- **Get** - Get a media item by ID
- **List** - List and filter media items
- **Update** - Update an existing media item
- **Delete** - Delete a media item

**Fields Supported:**
- Title, Subtitle, Description
- Date
- Speakers (max 3, formatted as tags: `speaker:Name`)
- Topics (max 10, formatted as tags: `topic:Name`)
- Scriptures (OSIS format, comma-separated)
- Speaker (direct field)
- External Audio/Video URLs
- Auto Publish setting
- Status (Draft, Published, Unlisted)
- Images (assign multiple images with types)

**List Operation Features:**
- Filtering by various fields
- Sorting options
- Pagination support (Return All or Limit)
- Include related resources

### Subsplash Events

Manage Subsplash calendars, events, and repeating events.

**Resources:**

#### Calendar
- **Create** - Create a new calendar
- **Get** - Get a calendar by ID
- **List** - List calendars
- **Update** - Update a calendar
- **Delete** - Delete a calendar

**Calendar Fields:**
- Title (required)
- Color (required for create, hex format)
- Subtitle
- Status (Draft, Scheduled, Published)
- Domain (General, Group)

#### Event
- **Create** - Create a new event
- **Get** - Get an event by ID
- **List** - List events
- **Update** - Update an event
- **Delete** - Delete an event

**Event Fields:**
- Calendar ID (required for create)
- Title (required)
- Start Date/Time (required)
- End Date/Time
- Description
- Subtitle
- Status (Draft, Scheduled, Published)
- All Day (boolean)
- Timezone (IANA format, e.g., America/Los_Angeles)
- Location ID

#### Repeating Event
- **Create** - Create a new repeating event
- **Get** - Get a repeating event by ID
- **List** - List repeating events
- **Update** - Update a repeating event
- **Delete** - Delete a repeating event

**Repeating Event Fields:**
- Title (required)
- Description
- Subtitle
- Status (Draft, Scheduled, Published)

### Subsplash People

Manage Subsplash profiles and households.

**Resources:**

#### Profile
- **Create** - Create a new profile
- **Get** - Get a profile by ID
- **List** - List profiles with filtering
- **Update** - Update a profile

**Profile Fields:**
- Full name, first name, last name
- Email, phone
- Address fields
- Custom fields
- Organization key

#### Household
- **Create** - Create a new household
- **Get** - Get a household by ID
- **List** - List households
- **Update** - Update a household
- **Delete** - Delete a household

**Household Fields:**
- Name
- Address fields
- Custom fields
- Organization key

## Credentials

This package requires Subsplash API credentials. You can authenticate using one of two methods:

### Authentication Method 1: Email/Password (v1) - Recommended

Simple authentication using email and password.

**Required Fields:**
- **Base URL** - Default: `https://core.subsplash.com`
- **Email** - Your Subsplash account email
- **Password** - Your Subsplash account password
- **App Key** (required) - Your Subsplash app key (e.g., "2T3DTM", "9XTSHD")
- **Scope** - Optional, defaults to `app:{APP_KEY}` format

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

## Usage Examples

### Example 1: Upload Artwork to Media Item

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

### Example 2: Create and Update Media Item

1. Add a **Subsplash Media** node to your workflow
2. Configure credentials
3. Select **Create** operation
4. Fill in required fields (title, etc.)
5. Add speakers, topics, or scriptures as needed
6. Execute to create the media item

To update later:
1. Add another **Subsplash Media** node
2. Select **Update** operation
3. Provide the **Media Item ID**
4. Fill in only the fields you want to update
5. Execute

**Note:** Only fields with values will be sent to the API. Empty fields are ignored.

### Example 3: Format Speakers and Topics

Speakers and topics are automatically formatted as tags:
- Speakers: `speaker:John Doe` (max 3)
- Topics: `topic:Faith` (max 10)

Enter comma-separated values:
- **Speakers**: `John Doe, Jane Smith`
- **Topics**: `Faith, Hope, Love`

### Example 4: Format Scriptures

Enter OSIS format references, comma-separated:
- **Scriptures**: `Gen.1.1,John.3.16,1Cor.13.1`

### Example 5: Manage Events

1. Add a **Subsplash Events** node
2. Select **Calendar** resource and **List** operation to see available calendars
3. Select **Event** resource and **Create** operation
4. Choose a calendar, set title and start date/time
5. Add description, location, or other details
6. Execute to create the event

### Example 6: List and Filter Media Items

1. Add a **Subsplash Media** node
2. Select **List** operation
3. Configure filters (date range, status, etc.)
4. Set sorting and pagination options
5. Execute to retrieve filtered results

## Compatibility

- **Minimum n8n version**: 1.0+
- **n8n API version**: 1
- **Node.js**: v22 or higher (for development)

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
- List operations support pagination with configurable limits

## Error Handling

The nodes include comprehensive error handling:

- **S3 Upload Errors**: Marked as `S3UploadError` with endpoint and status details
- **Partial Success**: For artwork uploads, partial successes are collected if some image types fail
- **Error Messages**: Include endpoint, HTTP status, and response body snippets (≤1KB)
- **Continue on Fail**: Supported for batch operations across all nodes

## Security

- All credentials are stored securely by n8n
- Bearer tokens are handled via OAuth with automatic refresh
- No sensitive data is logged verbatim
- Passwords are masked in the UI

## Version History

### 1.0.0

- Initial release
- **Subsplash Artwork**: Upload & Assign Artwork operation
- **Subsplash Media**: Full CRUD operations (Create, Get, List, Update, Delete)
- **Subsplash Events**: Calendar, Event, and Repeating Event resources with full CRUD
- **Subsplash People**: Profile and Household resources with full CRUD
- Support for both Email/Password (v1) and ROPC (v2) authentication
- Full field support for all resources
- Comprehensive error handling and validation

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[MIT](LICENSE.md)
