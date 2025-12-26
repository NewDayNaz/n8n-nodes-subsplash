/**
 * Standalone test script for Subsplash API (JavaScript version)
 * Run with: node test-api.js
 *
 * Set environment variables:
 * - SUBSplash_BASE_URL (optional, defaults to https://core.subsplash.com)
 * - SUBSplash_AUTH_METHOD (emailPassword or ropc)
 * - SUBSplash_EMAIL (for emailPassword)
 * - SUBSplash_PASSWORD
 * - SUBSplash_CLIENT_ID (for ropc)
 * - SUBSplash_CLIENT_SECRET (for ropc)
 * - SUBSplash_USERNAME (for ropc)
 * - SUBSplash_SCOPE (optional)
 * - SUBSplash_APP_KEY (required)
 * - SUBSplash_ORG_KEY (optional, for People API - defaults to APP_KEY if not provided)
 * - SUBSplash_MEDIA_ITEM_ID (optional, for update/delete/get tests)
 * - SUBSplash_CALENDAR_ID (optional, for calendar tests)
 * - SUBSplash_EVENT_ID (optional, for event tests)
 * - SUBSplash_PROFILE_ID (optional, for profile tests)
 * - SUBSplash_HOUSEHOLD_ID (optional, for household tests)
 */

const axios = require('axios');
const sharp = require('sharp');

class SubsplashApiTester {
	constructor() {
		this.baseUrl = process.env.SUBSPLASH_BASE_URL || 'https://core.subsplash.com';
		this.appKey = process.env.SUBSPLASH_APP_KEY || '';
		this.orgKey = process.env.SUBSPLASH_ORG_KEY || this.appKey; // Use app_key as fallback
		this.authMethod = process.env.SUBSPLASH_AUTH_METHOD || 'emailPassword';

		if (!this.appKey) {
			throw new Error('SUBSplash_APP_KEY environment variable is required');
		}
	}

	async authenticate() {
		console.log(`\n🔐 Authenticating using ${this.authMethod} method...`);
		console.log(`Base URL: ${this.baseUrl}`);

		if (this.authMethod === 'emailPassword') {
			return await this.authenticateEmailPassword();
		} else {
			return await this.authenticateROPC();
		}
	}

	async authenticateEmailPassword() {
		const email = process.env.SUBSPLASH_EMAIL;
		const password = process.env.SUBSPLASH_PASSWORD;
		const scope = process.env.SUBSPLASH_SCOPE || (this.appKey ? `app:${this.appKey}` : '');

		if (!email || !password) {
			throw new Error('SUBSplash_EMAIL and SUBSplash_PASSWORD are required for emailPassword authentication');
		}

		console.log(`Email: ${email}`);
		console.log(`Scope: ${scope || '(using app key)'}`);

		const formDataParts = [];
		formDataParts.push(`grant_type=password`);
		formDataParts.push(`email=${encodeURIComponent(email)}`);
		formDataParts.push(`password=${encodeURIComponent(password)}`);
		if (scope) {
			formDataParts.push(`scope=${encodeURIComponent(scope)}`);
		}
		const formDataString = formDataParts.join('&');

		const config = {
			method: 'POST',
			url: `${this.baseUrl}/accounts/v1/oauth/token`,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			data: formDataString,
		};

		try {
			const response = await axios(config);
			const token = response.data.access_token;
			console.log(`✅ Authentication successful!`);
			console.log(`Token (first 20 chars): ${token.substring(0, 20)}...`);
			console.log(`Expires in: ${response.data.expires_in || 'unknown'} seconds`);
			return token;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Authentication failed!`);
				console.error(`Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
				throw new Error(`Authentication failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
			}
			throw error;
		}
	}

	async authenticateROPC() {
		const clientId = process.env.SUBSPLASH_CLIENT_ID;
		const clientSecret = process.env.SUBSPLASH_CLIENT_SECRET;
		const username = process.env.SUBSPLASH_USERNAME;
		const password = process.env.SUBSPLASH_PASSWORD;
		const scope = process.env.SUBSPLASH_SCOPE || 'media:read media:write live:write';

		if (!clientId || !clientSecret || !username || !password) {
			throw new Error(
				'SUBSplash_CLIENT_ID, SUBSplash_CLIENT_SECRET, SUBSplash_USERNAME, and SUBSplash_PASSWORD are required for ROPC authentication',
			);
		}

		console.log(`Client ID: ${clientId}`);
		console.log(`Username: ${username}`);
		console.log(`Scope: ${scope}`);

		const config = {
			method: 'POST',
			url: `${this.baseUrl}/accounts/v2/oauth/token`,
			headers: {
				'Content-Type': 'application/json',
			},
			data: {
				grant_type: 'password',
				client_id: clientId,
				client_secret: clientSecret,
				username,
				password,
				scope,
			},
		};

		try {
			const response = await axios(config);
			const token = response.data.access_token;
			console.log(`✅ Authentication successful!`);
			console.log(`Token (first 20 chars): ${token.substring(0, 20)}...`);
			console.log(`Expires in: ${response.data.expires_in || 'unknown'} seconds`);
			return token;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Authentication failed!`);
				console.error(`Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
				throw new Error(`Authentication failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
			}
			throw error;
		}
	}

	async testGetMediaItems(token) {
		console.log(`\n📋 Testing: GET /media/v1/media-items`);
		const config = {
			method: 'GET',
			url: `${this.baseUrl}/media/v1/media-items`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
			},
			params: {
				'page[size]': 1,
				'filter[app_key]': this.appKey,
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Response keys:`, Object.keys(response.data));
			if (response.data._embedded && response.data._embedded['media-items']) {
				console.log(`Found ${response.data._embedded['media-items'].length} media item(s)`);
			}
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testCreateSourceImage(token) {
		console.log(`\n🖼️  Testing: POST /files/v1/images (create source)`);
		const config = {
			method: 'POST',
			url: `${this.baseUrl}/files/v1/images`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			data: {
				app_key: this.appKey,
				content_type: 'image/png',
				title: 'test-upload.png',
				type: 'source',
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Source Image ID: ${response.data.id}`);
			console.log(`Presigned URL present: ${!!response.data._links?.presigned_upload_url?.href}`);
			return response.data;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async extractColors(imageBuffer) {
		try {
			if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
				throw new Error('Invalid image buffer provided');
			}
			// Resize to a manageable size for color extraction (max 100x100)
			const resized = await sharp(imageBuffer).resize(100, 100, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
			
			const pixels = resized.data;
			const width = resized.info.width;
			const height = resized.info.height;
			const channels = resized.info.channels;
			
			let totalR = 0;
			let totalG = 0;
			let totalB = 0;
			let maxSaturation = 0;
			let vibrantR = 0;
			let vibrantG = 0;
			let vibrantB = 0;
			
			// Process pixels (skip fully transparent pixels for better color accuracy)
			let validPixelCount = 0;
			for (let i = 0; i < pixels.length; i += channels) {
				const r = pixels[i];
				const g = pixels[i + 1];
				const b = pixels[i + 2];
				const a = channels > 3 ? pixels[i + 3] : 255; // Alpha channel
				
				// Skip fully transparent pixels
				if (a < 128) continue;
				
				validPixelCount++;
				
				// Calculate average
				totalR += r;
				totalG += g;
				totalB += b;
				
				// Calculate saturation for vibrant color
				const max = Math.max(r, g, b);
				const min = Math.min(r, g, b);
				const saturation = max === 0 ? 0 : (max - min) / max;
				
				// Track most saturated color (prefer colors with good saturation)
				if (saturation > maxSaturation && saturation > 0.1) {
					maxSaturation = saturation;
					vibrantR = r;
					vibrantG = g;
					vibrantB = b;
				}
			}
			
			if (validPixelCount === 0) {
				throw new Error('No valid pixels found in image (all transparent)');
			}
			
			const avgR = Math.round(totalR / validPixelCount);
			const avgG = Math.round(totalG / validPixelCount);
			const avgB = Math.round(totalB / validPixelCount);
			
			// Ensure vibrant color has a value (if no saturated color found, use average)
			if (maxSaturation === 0) {
				vibrantR = avgR;
				vibrantG = avgG;
				vibrantB = avgB;
			}
			
			// Convert to hex (ensure lowercase and valid format)
			const averageColorHex = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`.toLowerCase();
			const vibrantColorHex = `#${vibrantR.toString(16).padStart(2, '0')}${vibrantG.toString(16).padStart(2, '0')}${vibrantB.toString(16).padStart(2, '0')}`.toLowerCase();
			
			// Validate hex format
			if (!/^#[0-9a-f]{6}$/i.test(averageColorHex) || !/^#[0-9a-f]{6}$/i.test(vibrantColorHex)) {
				throw new Error(`Invalid hex color format: average=${averageColorHex}, vibrant=${vibrantColorHex}`);
			}
			
			return {
				average_color_hex: averageColorHex,
				vibrant_color_hex: vibrantColorHex,
			};
		} catch (error) {
			// Fallback to default colors if extraction fails
			console.warn(`⚠️  Color extraction failed, using defaults: ${error.message}`);
			console.error(`   Error details:`, error);
			return {
				average_color_hex: '#2ea7cc',
				vibrant_color_hex: '#2ea7cc',
			};
		}
	}

	async createTestImage() {
		// Create a larger test image (100x100) with some color variation for better color extraction
		// This creates a simple gradient image
		const width = 100;
		const height = 100;
		const channels = 4; // RGBA
		const buffer = Buffer.alloc(width * height * channels);
		
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const index = (y * width + x) * channels;
				// Create a gradient: red increases horizontally, green increases vertically
				buffer[index] = Math.floor((x / width) * 255); // R
				buffer[index + 1] = Math.floor((y / height) * 255); // G
				buffer[index + 2] = 128; // B (constant)
				buffer[index + 3] = 255; // A (opaque)
			}
		}
		
		// Convert raw buffer to PNG using sharp
		return await sharp(buffer, {
			raw: {
				width,
				height,
				channels: 4,
			},
		})
			.png()
			.toBuffer();
	}

	async testS3Upload(presignedUrl, imageBuffer) {
		console.log(`\n☁️  Testing: PUT to S3 (presigned URL)`);
		const config = {
			method: 'PUT',
			url: presignedUrl,
			headers: {
				'Content-Type': 'image/png',
				'x-amz-acl': 'public-read',
				Origin: 'https://dashboard.subsplash.com',
			},
			data: imageBuffer,
			maxRedirects: 0,
			validateStatus: (status) => status >= 200 && status < 400,
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			return imageBuffer; // Return buffer for color extraction
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status || error.code}`);
				if (error.response.data) {
					console.error(`Response:`, error.response.data);
				}
			} else {
				console.error(`Error:`, error.message);
			}
			throw error;
		}
	}

	async testCreateTypedImage(token, sourceId, type, imageBuffer) {
		console.log(`\n🖼️  Testing: POST /files/v1/images (create ${type} typed image)`);
		
		// Extract colors from the image
		const colors = await this.extractColors(imageBuffer);
		console.log(`   Extracted colors: average=${colors.average_color_hex}, vibrant=${colors.vibrant_color_hex}`);
		
		const config = {
			method: 'POST',
			url: `${this.baseUrl}/files/v1/images`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			data: {
				app_key: this.appKey,
				content_type: 'image/png',
				title: 'test-upload.png',
				type,
				average_color_hex: colors.average_color_hex,
				vibrant_color_hex: colors.vibrant_color_hex,
				_embedded: {
					source: {
						id: sourceId,
						type: 'source',
					},
				},
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Typed Image ID (${type}): ${response.data.id}`);
			return response.data.id;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testGetMediaItem(token, mediaItemId) {
		console.log(`\n📋 Testing: GET /media/v1/media-items/${mediaItemId}`);
		const config = {
			method: 'GET',
			url: `${this.baseUrl}/media/v1/media-items/${mediaItemId}`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
			},
			params: {
				include: 'images,audio,video',
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Media Item ID: ${response.data.id}`);
			console.log(`Title: ${response.data.title || '(no title)'}`);
			return response.data;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testCreateMediaItem(token) {
		console.log(`\n📝 Testing: POST /media/v1/media-items (create)`);
		const config = {
			method: 'POST',
			url: `${this.baseUrl}/media/v1/media-items`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			data: {
				app_key: this.appKey,
				title: `Test Media Item ${new Date().toISOString()}`,
				status: 'draft',
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Created Media Item ID: ${response.data.id}`);
			console.log(`Title: ${response.data.title}`);
			return response.data.id;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testUpdateMediaItem(token, mediaItemId, newTitle) {
		console.log(`\n📝 Testing: PATCH /media/v1/media-items/${mediaItemId}`);
		const config = {
			method: 'PATCH',
			url: `${this.baseUrl}/media/v1/media-items/${mediaItemId}`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			data: {
				app_key: this.appKey,
				title: newTitle || `Test Update ${new Date().toISOString()}`,
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Updated Media Item ID: ${response.data.id}`);
			console.log(`Title: ${response.data.title}`);
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testRestoreMediaItemTitle(token, mediaItemId, originalTitle) {
		console.log(`\n🔄 Testing: PATCH /media/v1/media-items/${mediaItemId} (restore original title)`);
		const config = {
			method: 'PATCH',
			url: `${this.baseUrl}/media/v1/media-items/${mediaItemId}`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			data: {
				app_key: this.appKey,
				title: originalTitle,
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Restored Media Item Title: ${response.data.title || '(no title)'}`);
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testDeleteMediaItem(token, mediaItemId) {
		console.log(`\n🗑️  Testing: DELETE /media/v1/media-items/${mediaItemId}`);
		const config = {
			method: 'DELETE',
			url: `${this.baseUrl}/media/v1/media-items/${mediaItemId}`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Media Item deleted`);
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	// Events API Tests
	async testListCalendars(token) {
		console.log(`\n📅 Testing: GET /events/v2/calendars`);
		const config = {
			method: 'GET',
			url: `${this.baseUrl}/events/v2/calendars`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
			},
			params: {
				'page[size]': 5,
				'filter[app_key]': this.appKey,
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			if (response.data._embedded && response.data._embedded.calendars) {
				console.log(`Found ${response.data._embedded.calendars.length} calendar(s)`);
				if (response.data._embedded.calendars.length > 0) {
					console.log(`First calendar: ${response.data._embedded.calendars[0].title}`);
				}
			}
			return response.data._embedded?.calendars?.[0]?.id;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testGetCalendar(token, calendarId) {
		console.log(`\n📅 Testing: GET /events/v2/calendars/${calendarId}`);
		const config = {
			method: 'GET',
			url: `${this.baseUrl}/events/v2/calendars/${calendarId}`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Calendar ID: ${response.data.id}`);
			console.log(`Title: ${response.data.title}`);
			return response.data;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testCreateCalendar(token) {
		console.log(`\n📅 Testing: POST /events/v2/calendars (create)`);
		const config = {
			method: 'POST',
			url: `${this.baseUrl}/events/v2/calendars`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			data: {
				app_key: this.appKey,
				title: `Test Calendar ${new Date().toISOString()}`,
				color: '#FF5733',
				status: 'draft',
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Created Calendar ID: ${response.data.id}`);
			console.log(`Title: ${response.data.title}`);
			return response.data.id;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testDeleteCalendar(token, calendarId) {
		console.log(`\n🗑️  Testing: DELETE /events/v2/calendars/${calendarId}`);
		const config = {
			method: 'DELETE',
			url: `${this.baseUrl}/events/v2/calendars/${calendarId}`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Calendar deleted`);
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testListEvents(token) {
		console.log(`\n📆 Testing: GET /events/v2/events`);
		const config = {
			method: 'GET',
			url: `${this.baseUrl}/events/v2/events`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
			},
			params: {
				'page[size]': 5,
				'filter[app_key]': this.appKey,
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			if (response.data._embedded && response.data._embedded.events) {
				console.log(`Found ${response.data._embedded.events.length} event(s)`);
				if (response.data._embedded.events.length > 0) {
					console.log(`First event: ${response.data._embedded.events[0].title}`);
				}
			}
			return response.data._embedded?.events?.[0]?.id;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	// People API Tests
	async testListProfiles(token) {
		console.log(`\n👤 Testing: GET /people/v1/profiles`);
		const params = {
			'page[size]': 5,
		};
		// Only add org_key filter if orgKey is provided and different from appKey
		if (this.orgKey && this.orgKey !== this.appKey) {
			params['filter[org_key]'] = this.orgKey;
		}
		const config = {
			method: 'GET',
			url: `${this.baseUrl}/people/v1/profiles`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
			},
			params,
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			if (response.data._embedded && response.data._embedded.profiles) {
				console.log(`Found ${response.data._embedded.profiles.length} profile(s)`);
				if (response.data._embedded.profiles.length > 0) {
					const profile = response.data._embedded.profiles[0];
					console.log(`First profile: ${profile.first_name} ${profile.last_name}`);
				}
			}
			return response.data._embedded?.profiles?.[0]?.id;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testGetProfile(token, profileId) {
		console.log(`\n👤 Testing: GET /people/v1/profiles/${profileId}`);
		const config = {
			method: 'GET',
			url: `${this.baseUrl}/people/v1/profiles/${profileId}`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
			},
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			console.log(`Profile ID: ${response.data.id}`);
			console.log(`Name: ${response.data.first_name} ${response.data.last_name}`);
			return response.data;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async testListHouseholds(token) {
		console.log(`\n🏠 Testing: GET /people/v1/households`);
		const params = {
			'page[size]': 5,
		};
		// Only add org_key filter if orgKey is provided and different from appKey
		if (this.orgKey && this.orgKey !== this.appKey) {
			params['filter[org_key]'] = this.orgKey;
		}
		const config = {
			method: 'GET',
			url: `${this.baseUrl}/people/v1/households`,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.api+json',
			},
			params,
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
			if (response.data._embedded && response.data._embedded.households) {
				console.log(`Found ${response.data._embedded.households.length} household(s)`);
				if (response.data._embedded.households.length > 0) {
					console.log(`First household: ${response.data._embedded.households[0].name}`);
				}
			}
			return response.data._embedded?.households?.[0]?.id;
		} catch (error) {
			if (error.response) {
				console.error(`❌ Failed! Status: ${error.response.status}`);
				console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
			}
			throw error;
		}
	}

	async runTests(mediaItemId, calendarId, eventId, profileId, householdId) {
		console.log('🧪 Subsplash API Test Suite');
		console.log('='.repeat(50));

		const results = {
			passed: [],
			failed: [],
			skipped: [],
		};

		try {
			// Test 1: Authentication
			const token = await this.authenticate();
			results.passed.push('Authentication');

			// Media API Tests
			console.log(`\n${'='.repeat(50)}`);
			console.log('📹 MEDIA API TESTS');
			console.log('='.repeat(50));

			// Test 2: List Media Items
			try {
				await this.testGetMediaItems(token);
				results.passed.push('List Media Items');
			} catch (error) {
				results.failed.push('List Media Items');
				throw error;
			}

			// Test 3: Get Media Item (if ID provided) - Store original title for cleanup
			let originalMediaItemTitle = null;
			if (mediaItemId) {
				try {
					const mediaItem = await this.testGetMediaItem(token, mediaItemId);
					originalMediaItemTitle = mediaItem.title || null;
					results.passed.push('Get Media Item');
				} catch (error) {
					results.failed.push('Get Media Item');
					console.error('Continuing with other tests...');
				}
			} else {
				results.skipped.push('Get Media Item (no ID provided)');
			}

			// Test 4: Create Media Item
			let createdMediaItemId = null;
			try {
				createdMediaItemId = await this.testCreateMediaItem(token);
				results.passed.push('Create Media Item');
			} catch (error) {
				results.failed.push('Create Media Item');
				console.error('Continuing with other tests...');
			}

			// Test 5: Update Media Item (if ID provided)
			if (mediaItemId) {
				try {
					await this.testUpdateMediaItem(token, mediaItemId);
					results.passed.push('Update Media Item');
				} catch (error) {
					results.failed.push('Update Media Item');
					console.error('Continuing with other tests...');
				}
			} else {
				results.skipped.push('Update Media Item (no ID provided)');
			}

			// Artwork Upload Tests
			console.log(`\n${'='.repeat(50)}`);
			console.log('🖼️  ARTWORK UPLOAD TESTS');
			console.log('='.repeat(50));

			// Test 6: Create Source Image
			let sourceId = null;
			try {
				const sourceImage = await this.testCreateSourceImage(token);
				sourceId = sourceImage.id;
				const presignedUrl = sourceImage._links.presigned_upload_url.href;
				results.passed.push('Create Source Image');

				// Test 7: Upload to S3 (create a test image first)
				let uploadedImageBuffer = null;
				try {
					// Create a larger test image for better color extraction
					const testImage = await this.createTestImage();
					uploadedImageBuffer = await this.testS3Upload(presignedUrl, testImage);
					results.passed.push('S3 Upload');
				} catch (error) {
					results.failed.push('S3 Upload');
					console.error('Continuing with other tests...');
				}

				// Test 8: Create Typed Images (with color extraction)
				if (sourceId && uploadedImageBuffer) {
					try {
						await this.testCreateTypedImage(token, sourceId, 'wide', uploadedImageBuffer);
						results.passed.push('Create Typed Image (wide)');
					} catch (error) {
						results.failed.push('Create Typed Image (wide)');
						console.error('Note: Typed image creation may require color hex values');
					}
				}
			} catch (error) {
				results.failed.push('Create Source Image');
				console.error('Skipping artwork upload tests...');
			}

			// Events API Tests
			console.log(`\n${'='.repeat(50)}`);
			console.log('📅 EVENTS API TESTS');
			console.log('='.repeat(50));

			// Test 9: List Calendars
			let foundCalendarId = null;
			try {
				foundCalendarId = await this.testListCalendars(token);
				results.passed.push('List Calendars');
			} catch (error) {
				results.failed.push('List Calendars');
				console.error('Continuing with other tests...');
			}

			// Test 10: Get Calendar
			const testCalendarId = calendarId || foundCalendarId;
			if (testCalendarId) {
				try {
					await this.testGetCalendar(token, testCalendarId);
					results.passed.push('Get Calendar');
				} catch (error) {
					results.failed.push('Get Calendar');
					console.error('Continuing with other tests...');
				}
			} else {
				results.skipped.push('Get Calendar (no ID available)');
			}

			// Test 11: Create Calendar
			let createdCalendarId = null;
			try {
				createdCalendarId = await this.testCreateCalendar(token);
				results.passed.push('Create Calendar');
			} catch (error) {
				results.failed.push('Create Calendar');
				console.error('Continuing with other tests...');
			}

			// Test 12: List Events
			try {
				await this.testListEvents(token);
				results.passed.push('List Events');
			} catch (error) {
				results.failed.push('List Events');
				console.error('Continuing with other tests...');
			}

			// People API Tests
			console.log(`\n${'='.repeat(50)}`);
			console.log('👥 PEOPLE API TESTS');
			console.log('='.repeat(50));

			// Test 13: List Profiles
			let foundProfileId = null;
			try {
				foundProfileId = await this.testListProfiles(token);
				results.passed.push('List Profiles');
			} catch (error) {
				results.failed.push('List Profiles');
				console.error('Continuing with other tests...');
			}

			// Test 14: Get Profile
			const testProfileId = profileId || foundProfileId;
			if (testProfileId) {
				try {
					await this.testGetProfile(token, testProfileId);
					results.passed.push('Get Profile');
				} catch (error) {
					results.failed.push('Get Profile');
					console.error('Continuing with other tests...');
				}
			} else {
				results.skipped.push('Get Profile (no ID available)');
			}

			// Test 15: List Households
			try {
				await this.testListHouseholds(token);
				results.passed.push('List Households');
			} catch (error) {
				results.failed.push('List Households');
				console.error('Continuing with other tests...');
			}

			// Cleanup: Restore original media item title and delete created test resources
			if (mediaItemId && originalMediaItemTitle !== null) {
				console.log(`\n🧹 Restoring original title for media item: ${mediaItemId}`);
				try {
					await this.testRestoreMediaItemTitle(token, mediaItemId, originalMediaItemTitle);
					results.passed.push('Restore Media Item Title (cleanup)');
				} catch (error) {
					results.failed.push('Restore Media Item Title (cleanup)');
					console.error('Note: Media item title may need manual restoration');
				}
			}

			if (createdMediaItemId) {
				console.log(`\n🧹 Cleaning up test media item: ${createdMediaItemId}`);
				try {
					await this.testDeleteMediaItem(token, createdMediaItemId);
					results.passed.push('Delete Media Item (cleanup)');
				} catch (error) {
					results.failed.push('Delete Media Item (cleanup)');
					console.error('Note: Test media item may need manual cleanup');
				}
			}

			if (createdCalendarId) {
				console.log(`\n🧹 Cleaning up test calendar: ${createdCalendarId}`);
				try {
					await this.testDeleteCalendar(token, createdCalendarId);
					results.passed.push('Delete Calendar (cleanup)');
				} catch (error) {
					results.failed.push('Delete Calendar (cleanup)');
					console.error('Note: Test calendar may need manual cleanup');
				}
			}

			// Summary
			console.log(`\n${'='.repeat(50)}`);
			console.log('📊 TEST SUMMARY');
			console.log('='.repeat(50));
			console.log(`✅ Passed: ${results.passed.length}`);
			results.passed.forEach((test) => console.log(`   - ${test}`));
			if (results.failed.length > 0) {
				console.log(`\n❌ Failed: ${results.failed.length}`);
				results.failed.forEach((test) => console.log(`   - ${test}`));
			}
			if (results.skipped.length > 0) {
				console.log(`\n⏭️  Skipped: ${results.skipped.length}`);
				results.skipped.forEach((test) => console.log(`   - ${test}`));
			}

			if (results.failed.length === 0) {
				console.log(`\n${'='.repeat(50)}`);
				console.log(`✅ All tests passed!`);
			} else {
				console.log(`\n${'='.repeat(50)}`);
				console.log(`⚠️  Some tests failed. See details above.`);
			}
		} catch (error) {
			console.error(`\n${'='.repeat(50)}`);
			console.error(`❌ Test suite failed!`);
			if (error instanceof Error) {
				console.error(`Error: ${error.message}`);
			}
			process.exit(1);
		}
	}
}

// Main execution
const tester = new SubsplashApiTester();
const mediaItemId = process.env.SUBSPLASH_MEDIA_ITEM_ID;
const calendarId = process.env.SUBSPLASH_CALENDAR_ID;
const eventId = process.env.SUBSPLASH_EVENT_ID;
const profileId = process.env.SUBSPLASH_PROFILE_ID;
const householdId = process.env.SUBSPLASH_HOUSEHOLD_ID;

tester.runTests(mediaItemId, calendarId, eventId, profileId, householdId).catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});

