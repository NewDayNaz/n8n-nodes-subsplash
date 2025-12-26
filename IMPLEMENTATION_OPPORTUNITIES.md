# Subsplash API Implementation Opportunities

This document lists potential new nodes and enhancements to existing nodes based on the official OpenAPI specification.

## 🎉 Recent Completions

**Phase 1, 2, and 3 have been completed!** The following implementations are now available:

- ✅ **Subsplash Media Node** - Full CRUD operations (Create, Read, Update, Delete, List)
- ✅ **Subsplash Events Node** - Complete calendar, event, and repeating event management
- ✅ **Subsplash People Node** - Profile and household management

All implementations include proper error handling, type safety, pagination support, and follow n8n best practices.

## Current Implementation Status

### ✅ Fully Implemented
- **Subsplash Artwork Node**: Upload artwork and assign to media items
- **Subsplash Media Node**: Complete CRUD operations (Create, Read, Update, Delete, List)
  - GET operation with include support
  - LIST operation with filtering, sorting, and pagination
  - POST (create) operation
  - PATCH (update) operation
  - DELETE operation
- **Subsplash Events Node**: Calendar, Event, and Repeating Event management
  - Calendar: Create, Get, List, Update, Delete
  - Event: Create, Get, List, Update, Delete
  - Repeating Event: Create, Get, List, Update, Delete
- **Subsplash People Node**: Profile and Household management
  - Profile: Create, Get, List, Update (with filtering)
  - Household: Create, Get, List, Update, Delete

---

## Enhancements to Existing Nodes

### 1. ✅ Subsplash Media Node - Complete CRUD Operations

**Priority: HIGH** | **Effort: LOW** | **Status: COMPLETED**

All CRUD operations have been added to the Media node:

#### ✅ Get Media Item
- **Operation**: `get` - **IMPLEMENTED**
- **Endpoint**: `GET /media/v1/media-items/{id}`
- **Features**:
  - Include related resources (images, audio, video, document, broadcast, live-template)
  - Return full media item data

#### ✅ List Media Items
- **Operation**: `list` - **IMPLEMENTED**
- **Endpoint**: `GET /media/v1/media-items`
- **Features**:
  - Filter by: app_key, media_series, speaker, status, title
  - Sort by: published_at, created_at, updated_at, title, date
  - Pagination support (returnAll option)
  - Include related resources

#### ✅ Create Media Item
- **Operation**: `create` - **IMPLEMENTED**
- **Endpoint**: `POST /media/v1/media-items`
- **Features**:
  - All fields from update operation
  - Support for embedded images
  - Include related resources in response

#### ✅ Delete Media Item
- **Operation**: `delete` - **IMPLEMENTED**
- **Endpoint**: `DELETE /media/v1/media-items/{id}`

---

## New Nodes

### 2. Subsplash Media Series Node

**Priority: MEDIUM** | **Effort: MEDIUM**

Manage media series (collections of media items like sermon series).

**Operations**:
- `list` - Get all media series
- `get` - Get one media series
- `create` - Create a new media series
- `update` - Update media series
- `delete` - Delete media series

**Key Features**:
- Manage series metadata (title, description, images)
- Link media items to series
- Manage end-user access roles

**Endpoints**:
- `GET /media/v1/media-series`
- `GET /media/v1/media-series/{id}`
- `POST /media/v1/media-series`
- `PATCH /media/v1/media-series/{id}`
- `DELETE /media/v1/media-series/{id}`

---

### 3. ✅ Subsplash Events Node

**Priority: HIGH** | **Effort: MEDIUM** | **Status: COMPLETED**

Manage calendars and events (church events, services, etc.).

**Operations** (All Implemented):
- ✅ `list` (Calendars) - List all calendars
- ✅ `get` (Calendar) - Get calendar details
- ✅ `create` (Calendar) - Create calendar
- ✅ `update` (Calendar) - Update calendar
- ✅ `delete` (Calendar) - Delete calendar
- ✅ `list` (Events) - List events
- ✅ `get` (Event) - Get event details
- ✅ `create` (Event) - Create event
- ✅ `update` (Event) - Update event
- ✅ `delete` (Event) - Delete event
- ✅ `list` (Repeating Events) - List repeating events
- ✅ `get` (Repeating Event) - Get repeating event details
- ✅ `create` (Repeating Event) - Create repeating event
- ✅ `update` (Repeating Event) - Update repeating event
- ✅ `delete` (Repeating Event) - Delete repeating event

**Key Features**:
- Calendar management (title, subtitle, color, status, domain)
- Event creation with dates, times, locations, timezone
- Repeating events support
- All-day event support
- Pagination support

**Endpoints**:
- `/events/v2/calendars`
- `/events/v2/calendars/{id}`
- `/events/v2/events`
- `/events/v2/events/{id}`
- `/events/v2/repeating-events`
- `/events/v2/repeating-events/{id}`

---

### 4. ✅ Subsplash People/Profiles Node

**Priority: HIGH** | **Effort: HIGH** | **Status: COMPLETED**

Manage people profiles and households (church members, contacts).

**Operations** (All Implemented):
- ✅ `list` (Profiles) - List profiles with filtering
- ✅ `get` (Profile) - Get profile details
- ✅ `create` (Profile) - Create profile
- ✅ `update` (Profile) - Update profile
- ✅ `list` (Households) - List households
- ✅ `get` (Household) - Get household details
- ✅ `create` (Household) - Create household
- ✅ `update` (Household) - Update household
- ✅ `delete` (Household) - Delete household

**Key Features**:
- Profile management (name, email, phone, date of birth, gender, external ID)
- Household management (name, primary email, primary phone)
- Filtering (email, first_name, last_name, external_id)
- Household relationships (parent, guardian, child roles)
- Field length validation
- Pagination support

**Endpoints**:
- `/people/v1/profiles`
- `/people/v1/profiles/{id}`
- `/people/v1/households`
- `/people/v1/households/{id}`

**Note**: Core functionality implemented. Additional features like custom fields, address management, and more extensive filtering can be added in future iterations.

---

### 5. Subsplash Donations Node

**Priority: MEDIUM** | **Effort: MEDIUM**

Manage donations and giving (read-only for most operations).

**Operations**:
- `listDonations` - List donations with extensive filtering
- `getDonation` - Get donation details
- `listRecurringDonations` - List recurring donations
- `getRecurringDonation` - Get recurring donation details
- `listPledges` - List pledges
- `getPledge` - Get pledge details
- `listRefunds` - List refunds
- `getRefund` - Get refund details

**Key Features**:
- Extensive filtering (date ranges, amounts, status, fund, campus, etc.)
- Recurring donation management
- Pledge tracking
- Refund management
- Payment instrument details

**Endpoints**:
- `/donations`
- `/donations/{id}`
- `/recurring-donations`
- `/recurring-donations/{id}`
- `/pledges`
- `/pledges/{id}`
- `/refunds`
- `/refunds/{id}`

**Note**: Most operations are read-only. Creation typically happens through payment forms.

---

### 6. Subsplash Funds Node

**Priority: MEDIUM** | **Effort: LOW**

Manage giving funds (General Fund, Building Fund, etc.).

**Operations**:
- `list` - List all funds
- `get` - Get fund details
- `create` - Create fund
- `update` - Update fund

**Key Features**:
- Fund name and description
- Fund summaries (totals, counts)

**Endpoints**:
- `/funds`
- `/funds/{id}`

---

### 7. Subsplash Groups Node

**Priority: MEDIUM** | **Effort: MEDIUM**

Manage groups and group members (small groups, ministries, etc.).

**Operations**:
- `listGroups` - List groups
- `getGroup` - Get group details
- `createGroup` - Create group
- `updateGroup` - Update group
- `deleteGroup` - Delete group
- `listGroupMembers` - List group members
- `getGroupMember` - Get group member details
- `createGroupMember` - Add member to group
- `updateGroupMember` - Update member role/details
- `deleteGroupMember` - Remove member from group
- `listGroupTypes` - List group types
- `getGroupType` - Get group type details
- `createGroupType` - Create group type
- `updateGroupType` - Update group type
- `deleteGroupType` - Delete group type

**Key Features**:
- Group management
- Member management
- Group types/categories
- Group images

**Endpoints**:
- `/groups/v1/groups`
- `/groups/v1/groups/{id}`
- `/groups/v1/group-members`
- `/groups/v1/group-members/{id}`
- `/groups/v1/group-types`
- `/groups/v1/group-types/{id}`

---

### 8. Subsplash Notifications Node

**Priority: LOW** | **Effort: LOW**

Manage push notifications.

**Operations**:
- `list` - List notifications
- `get` - Get notification details
- `create` - Create notification
- `update` - Update notification
- `delete` - Delete notification

**Key Features**:
- Push notification management
- Target audiences
- Scheduling

**Endpoints**:
- `/notifications`
- `/notifications/{id}`

---

### 9. Subsplash Links/Pages Node

**Priority: LOW** | **Effort: LOW**

Manage custom links/pages.

**Operations**:
- `list` - List links
- `get` - Get link details
- `create` - Create link
- `update` - Update link
- `delete` - Delete link

**Key Features**:
- Custom page/link management
- Link metadata

**Endpoints**:
- `/pages/v1/links`
- `/pages/v1/links/{id}`

---

### 10. Subsplash Topics Node

**Priority: LOW** | **Effort: LOW**

Manage topics and topic subscriptions.

**Operations**:
- `listTopics` - List topics
- `getTopic` - Get topic details
- `createTopic` - Create topic
- `listTopicSubscriptions` - List subscriptions
- `getTopicSubscription` - Get subscription details
- `createBulkTopicSubscription` - Bulk subscribe users

**Key Features**:
- Topic management
- User subscriptions to topics
- Bulk operations

**Endpoints**:
- `/topics`
- `/topics/{id}`
- `/topic-subscriptions`
- `/topic-subscriptions/{id}`
- `/bulk-topic-subscriptions`

---

### 11. Subsplash Builder/Lists Node

**Priority: LOW** | **Effort: MEDIUM**

Manage lists and list rows (for custom data management).

**Operations**:
- `listLists` - List all lists
- `getList` - Get list details
- `createList` - Create list
- `updateList` - Update list
- `deleteList` - Delete list
- `listListRows` - List rows in a list
- `getListRow` - Get list row details
- `createListRow` - Create list row
- `updateListRow` - Update list row
- `deleteListRow` - Delete list row

**Key Features**:
- Custom list management
- List row management
- Standard and dynamic lists

**Endpoints**:
- `/builder/v1/lists`
- `/builder/v1/lists/{id}`
- `/builder/v1/list-rows`
- `/builder/v1/lists-rows/{id}`

---

### 12. Subsplash Campaigns Node

**Priority: LOW** | **Effort: LOW**

Manage giving campaigns.

**Operations**:
- `list` - List campaigns
- `get` - Get campaign details
- `getContributions` - Get campaign contributions

**Key Features**:
- Campaign information
- Contribution tracking

**Endpoints**:
- `/campaigns`
- `/campaigns/{id}`
- `/campaigns/{id}/contributions`

**Note**: Mostly read-only operations

---

### 13. Subsplash Webhooks Node

**Priority: MEDIUM** | **Effort: MEDIUM**

Manage webhooks for event notifications.

**Operations**:
- `list` - List webhooks
- `get` - Get webhook details
- `create` - Create webhook
- `update` - Update webhook
- `delete` - Delete webhook
- `rotateSecret` - Rotate webhook secret
- `listSendAttempts` - List webhook delivery attempts

**Key Features**:
- Webhook management
- Secret rotation
- Delivery tracking

**Endpoints**:
- `/webhooks/v1/webhooks`
- `/webhooks/v1/webhooks/{id}`
- `/webhooks/v1/webhooks/{id}/rotate-secret`
- `/webhooks/v1/send-attempts`

---

## Implementation Priority Recommendations

### Phase 1: High Priority (Complete Core Functionality) ✅ COMPLETED
1. ✅ **Media Node Enhancements** - Added GET, POST, DELETE, LIST operations
2. ✅ **Events Node** - Calendar and event management implemented
3. ✅ **People/Profiles Node** - Member and household management implemented

### Phase 2: Medium Priority (Common Use Cases) - NEXT UP
4. **Donations Node** - Giving management and reporting
5. **Groups Node** - Small groups and ministries
6. **Media Series Node** - Sermon series management
7. **Webhooks Node** - Event notifications

### Phase 3: Lower Priority (Specialized Use Cases)
8. **Funds Node** - Giving fund management
9. **Topics Node** - Content categorization
10. **Notifications Node** - Push notifications
11. **Links/Pages Node** - Custom pages
12. **Builder/Lists Node** - Custom data management
13. **Campaigns Node** - Campaign tracking

---

## Technical Considerations

### Common Patterns Across Nodes

1. **Pagination**: Most list operations support `page[number]` and `page[size]`
2. **Filtering**: Extensive filter support with `filter[field]` syntax
3. **Sorting**: Many endpoints support `sort` parameter
4. **Includes**: Many endpoints support `include` for related resources
5. **Field Selection**: Some endpoints support sparse fieldsets with `fields[TYPE]`

### Complexity Factors

- **Simple Nodes** (LOW effort): Funds, Topics, Links - Few fields, straightforward CRUD
- **Medium Nodes** (MEDIUM effort): Events, Donations, Groups - More fields, relationships, filtering
- **Complex Nodes** (HIGH effort): People/Profiles - Many fields, custom fields, relationships, household management

### Authentication

All endpoints use the same authentication mechanism we've already implemented (Bearer token from OAuth).

---

## Suggested Next Steps

### ✅ Completed
1. ✅ **Media Node Enhancements** - All CRUD operations implemented
2. ✅ **Events Node** - Full calendar, event, and repeating event management
3. ✅ **People/Profiles Node** - Profile and household management

### Recommended Next Priorities
1. **Donations Node** - Giving management and reporting (Phase 2)
2. **Groups Node** - Small groups and ministries management (Phase 2)
3. **Media Series Node** - Sermon series management (Phase 2)
4. **Webhooks Node** - Event notifications (Phase 2)
5. **Funds Node** - Giving fund management (Phase 3)
6. **Topics Node** - Content categorization (Phase 3)
7. **Remaining nodes** - Based on user demand and feedback

---

## Notes

- Most payment-related operations (PaymentIntent, SetupIntent, Instruments) are typically handled through payment forms and may not need direct API access
- Some operations are read-only by design (e.g., most donation operations)
- Consider user feedback to prioritize which nodes to implement first

