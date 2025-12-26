import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	IHttpRequestHelper,
	ICredentialDataDecryptedObject,
	IDataObject,
} from 'n8n-workflow';

export class SubsplashApi implements ICredentialType {
	name = 'subsplashApi';

	displayName = 'Subsplash (ROPC) API';

	icon: Icon = 'file:../icons/subsplash.svg';

	documentationUrl = 'https://developer.subsplash.com';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://core.subsplash.com',
			description: 'Subsplash API base URL',
		},
		{
			displayName: 'Authentication Method',
			name: 'authenticationMethod',
			type: 'options',
			options: [
				{
					name: 'Email/Password (v1)',
					value: 'emailPassword',
					description: 'Simple email/password authentication using /accounts/v1/oauth/token',
				},
				{
					name: 'ROPC with Client Credentials (v2)',
					value: 'ropc',
					description: 'Resource Owner Password Credentials with client_id/client_secret using /accounts/v2/oauth/token',
				},
			],
			default: 'emailPassword',
			description: 'Choose authentication method',
		},
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					authenticationMethod: ['emailPassword'],
				},
			},
			description: 'Subsplash account email',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Subsplash account password',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					authenticationMethod: ['ropc'],
				},
			},
			description: 'OAuth client ID',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			displayOptions: {
				show: {
					authenticationMethod: ['ropc'],
				},
			},
			description: 'OAuth client secret',
		},
		{
			displayName: 'Username (Email)',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					authenticationMethod: ['ropc'],
				},
			},
			description: 'Subsplash account email (for ROPC)',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					authenticationMethod: ['emailPassword'],
				},
			},
			description: 'OAuth scope in format "app:{APP_KEY}" (e.g., "app:9XTSHD"). If empty, will use App Key below.',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'media:read media:write live:write',
			displayOptions: {
				show: {
					authenticationMethod: ['ropc'],
				},
			},
			description: 'OAuth scope (space-separated)',
		},
		{
			displayName: 'App Key',
			name: 'appKey',
			type: 'string',
			default: '',
			required: true,
			description: 'Your Subsplash app key (e.g., "2T3DTM" or "9XTSHD")',
		},
		{
			displayName: 'Org Key',
			name: 'orgKey',
			type: 'string',
			default: '',
			description:
				'Your Subsplash organization key (8 characters, e.g., "SUBSPLSH"). Required for People API. If empty, will use App Key.',
		},
	];

	preAuthentication = async function (
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<IDataObject> {
		const authMethod = (credentials.authenticationMethod as string) || 'emailPassword';
		const baseUrl = (credentials.baseUrl as string) || 'https://core.subsplash.com';
		const appKey = (credentials.appKey as string) || '';

		if (authMethod === 'emailPassword') {
			// v1 endpoint: email/password with form data
			const email = credentials.email as string;
			const password = credentials.password as string;
			const scope = (credentials.scope as string) || (appKey ? `app:${appKey}` : '');

			if (!email || !password) {
				throw new Error('Email and password are required for email/password authentication');
			}

			// Use form data for v1 endpoint (build URL-encoded string)
			// Match the exact format from test-api.js
			const formDataParts: string[] = [];
			formDataParts.push(`grant_type=password`);
			formDataParts.push(`email=${encodeURIComponent(email)}`);
			formDataParts.push(`password=${encodeURIComponent(password)}`);
			if (scope) {
				formDataParts.push(`scope=${encodeURIComponent(scope)}`);
			}
			const formDataString = formDataParts.join('&');

			try {
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseUrl}/accounts/v1/oauth/token`,
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: formDataString,
					json: false,
				});

				// Parse response (may be JSON string or object)
				// Handle both string and object responses
				let responseData: IDataObject;
				if (typeof response === 'string') {
					try {
						responseData = JSON.parse(response);
					} catch {
						throw new Error(
							`Failed to parse authentication response: ${response.substring(0, 200)}`,
						);
					}
				} else if (response && typeof response === 'object') {
					responseData = response as IDataObject;
				} else {
					throw new Error(`Unexpected response type: ${typeof response}`);
				}

				// Validate response has access_token
				if (!responseData.access_token) {
					throw new Error(
						`Authentication response missing access_token. Response: ${JSON.stringify(responseData)}`,
					);
				}

				// Cache token with 30 second buffer before expiry
				const expiresIn = (responseData.expires_in as number) || 3600;
				const expiresAt = Date.now() + (expiresIn - 30) * 1000;

				return {
					accessToken: responseData.access_token as string,
					expiresAt,
				};
			} catch (error) {
				// Provide better error messages
				if (error && typeof error === 'object' && 'response' in error) {
					const httpError = error as {
						response?: {
							statusCode?: number;
							status?: number;
							body?: unknown;
							data?: unknown;
						};
					};
					if (httpError.response) {
						const status = httpError.response.statusCode || httpError.response.status;
						const body = httpError.response.body || httpError.response.data;
						const bodyStr =
							typeof body === 'string' ? body : JSON.stringify(body, null, 2);
						throw new Error(
							`Authentication failed with status ${status}: ${bodyStr.substring(0, 500)}`,
						);
					}
				}
				if (error instanceof Error) {
					throw error;
				}
				throw new Error(`Authentication failed: ${String(error)}`);
			}
		} else {
			// v2 endpoint: ROPC with client credentials
			const { clientId, clientSecret, username, password, scope } = credentials as {
				clientId: string;
				clientSecret: string;
				username: string;
				password: string;
				scope: string;
			};

			if (!clientId || !clientSecret || !username || !password) {
				throw new Error(
					'Client ID, Client Secret, Username, and Password are required for ROPC authentication',
				);
			}

			try {
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseUrl}/accounts/v2/oauth/token`,
					headers: { 'Content-Type': 'application/json' },
					body: {
						grant_type: 'password',
						client_id: clientId,
						client_secret: clientSecret,
						username,
						password,
						scope: scope || 'media:read media:write live:write',
					},
					json: true,
				});

				// Validate response has access_token
				if (!response || typeof response !== 'object' || !('access_token' in response)) {
					throw new Error(
						`Authentication response missing access_token. Response: ${JSON.stringify(response)}`,
					);
				}

				const responseData = response as { access_token: string; expires_in?: number };

				// Cache token with 30 second buffer before expiry
				const expiresIn = responseData.expires_in || 3600;
				const expiresAt = Date.now() + (expiresIn - 30) * 1000;

				return {
					accessToken: responseData.access_token,
					expiresAt,
				};
			} catch (error) {
				// Provide better error messages
				if (error && typeof error === 'object' && 'response' in error) {
					const httpError = error as {
						response?: {
							statusCode?: number;
							status?: number;
							body?: unknown;
							data?: unknown;
						};
					};
					if (httpError.response) {
						const status = httpError.response.statusCode || httpError.response.status;
						const body = httpError.response.body || httpError.response.data;
						const bodyStr =
							typeof body === 'string' ? body : JSON.stringify(body, null, 2);
						throw new Error(
							`Authentication failed with status ${status}: ${bodyStr.substring(0, 500)}`,
						);
					}
				}
				if (error instanceof Error) {
					throw error;
				}
				throw new Error(`Authentication failed: ${String(error)}`);
			}
		}
	};

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
				Accept: 'application/vnd.api+json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl || "https://core.subsplash.com"}}',
			url: '/events/v2/calendars',
			method: 'GET',
			qs: {
				'page[size]': 1,
				'filter[app_key]': '={{$credentials.appKey}}',
			},
		},
	};
}

