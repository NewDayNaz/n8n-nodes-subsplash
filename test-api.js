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
 * - SUBSplash_MEDIA_ITEM_ID (optional, for update test)
 */

const axios = require('axios');

class SubsplashApiTester {
	constructor() {
		this.baseUrl = process.env.SUBSPLASH_BASE_URL || 'https://core.subsplash.com';
		this.appKey = process.env.SUBSPLASH_APP_KEY || '';
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

	async testS3Upload(presignedUrl) {
		console.log(`\n☁️  Testing: PUT to S3 (presigned URL)`);
		// Create a minimal 1x1 PNG
		const pngData = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
			'base64',
		);

		const config = {
			method: 'PUT',
			url: presignedUrl,
			headers: {
				'Content-Type': 'image/png',
				'x-amz-acl': 'public-read',
				Origin: 'https://dashboard.subsplash.com',
			},
			data: pngData,
			maxRedirects: 0,
			validateStatus: (status) => status >= 200 && status < 400,
		};

		try {
			const response = await axios(config);
			console.log(`✅ Success! Status: ${response.status}`);
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

	async testCreateTypedImage(token, sourceId, type) {
		console.log(`\n🖼️  Testing: POST /files/v1/images (create ${type} typed image)`);
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

	async testUpdateMediaItem(token, mediaItemId) {
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
				id: mediaItemId,
				app_key: this.appKey,
				title: `Test Update ${new Date().toISOString()}`,
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

	async runTests(mediaItemId) {
		console.log('🧪 Subsplash API Test Suite');
		console.log('='.repeat(50));

		try {
			// Test 1: Authentication
			const token = await this.authenticate();

			// Test 2: Get Media Items
			await this.testGetMediaItems(token);

			// Test 3: Create Source Image
			const sourceImage = await this.testCreateSourceImage(token);
			const sourceId = sourceImage.id;
			const presignedUrl = sourceImage._links.presigned_upload_url.href;

			// Test 4: Upload to S3
			await this.testS3Upload(presignedUrl);

			// Test 5: Create Typed Images
			const wideId = await this.testCreateTypedImage(token, sourceId, 'wide');
			await this.testCreateTypedImage(token, sourceId, 'square');
			await this.testCreateTypedImage(token, sourceId, 'banner');

			// Test 6: Update Media Item (if ID provided)
			if (mediaItemId) {
				await this.testUpdateMediaItem(token, mediaItemId);
			} else {
				console.log(`\n⏭️  Skipping media item update (no SUBSplash_MEDIA_ITEM_ID provided)`);
			}

			console.log(`\n${'='.repeat(50)}`);
			console.log(`✅ All tests passed!`);
			console.log(`\nSummary:`);
			console.log(`- Authentication: ✅`);
			console.log(`- Get Media Items: ✅`);
			console.log(`- Create Source Image: ✅ (ID: ${sourceId})`);
			console.log(`- S3 Upload: ✅`);
			console.log(`- Create Typed Images: ✅ (Wide ID: ${wideId})`);
			if (mediaItemId) {
				console.log(`- Update Media Item: ✅`);
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

tester.runTests(mediaItemId).catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});

