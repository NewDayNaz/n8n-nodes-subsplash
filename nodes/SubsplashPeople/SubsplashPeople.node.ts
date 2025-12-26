import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

interface ProfileResponse {
	id: string;
	first_name: string;
	last_name: string;
	email?: string;
	org_key: string;
	date_of_birth?: string;
	gender?: string;
	phone?: {
		number: string;
		country_code?: string;
	};
	_embedded?: {
		address?: { id: string };
		'end-user'?: { id: string };
		household?: { id: string };
	};
}

interface HouseholdResponse {
	id: string;
	name: string;
	org_key: string;
	primary_email?: string;
	primary_phone?: {
		number: string;
		country_code?: string;
	};
	_embedded?: {
		members?: Array<{ id: string; household_role?: string }>;
		address?: { id: string };
	};
}

export class SubsplashPeople implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Subsplash People',
		name: 'subsplashPeople',
		icon: { light: 'file:../../icons/subsplash.svg', dark: 'file:../../icons/subsplash.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"]}} - {{$parameter["operation"]}}',
		description: 'Manage Subsplash profiles and households',
		defaults: {
			name: 'Subsplash People',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'subsplashApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Profile',
						value: 'profile',
					},
					{
						name: 'Household',
						value: 'household',
					},
				],
				default: 'profile',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['profile'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a profile',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a profile',
					},
					{
						name: 'List',
						value: 'list',
						action: 'List profiles',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a profile',
					},
				],
				default: 'list',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['household'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a household',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a household',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a household',
					},
					{
						name: 'List',
						value: 'list',
						action: 'List households',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a household',
					},
				],
				default: 'list',
			},
			// Profile fields
			{
				displayName: 'Profile ID',
				name: 'profileId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['profile'],
						operation: ['get', 'update'],
					},
				},

			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['profile'],
						operation: ['create', 'update'],
					},
				},
				description: 'First name (max 35 characters)',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['profile'],
						operation: ['create', 'update'],
					},
				},
				description: 'Last name (max 35 characters)',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				displayOptions: {
					show: {
						resource: ['profile'],
						operation: ['create', 'update'],
					},
				},
				description: 'Primary email address',
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['profile'],
						operation: ['create', 'update'],
					},
				},

			},
			{
				displayName: 'Date of Birth',
				name: 'dateOfBirth',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						resource: ['profile'],
						operation: ['create', 'update'],
					},
				},

			},
			{
				displayName: 'Gender',
				name: 'gender',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['profile'],
						operation: ['create', 'update'],
					},
				},

			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['profile'],
						operation: ['create', 'update'],
					},
				},
				description: 'External system identifier (max 50 characters)',
			},
			{
				displayName: 'Household ID',
				name: 'householdId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['profile'],
						operation: ['create', 'update'],
					},
				},
				description: 'Household ID to link profile to',
			},
			{
				displayName: 'Household Role',
				name: 'householdRole',
				type: 'options',
				options: [
					{
						name: 'Parent',
						value: 'parent',
					},
					{
						name: 'Guardian',
						value: 'guardian',
					},
					{
						name: 'Child',
						value: 'child',
					},
				],
				default: 'parent',
				displayOptions: {
					show: {
						resource: ['profile'],
						operation: ['create', 'update'],
					},
				},
				description: 'Role in household (required if household ID is provided)',
			},
			// Household fields
			{
				displayName: 'Household ID',
				name: 'householdId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['household'],
						operation: ['get', 'update', 'delete'],
					},
				},

			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['household'],
						operation: ['create', 'update'],
					},
				},
				description: 'Household name (max 100 characters)',
			},
			{
				displayName: 'Primary Email',
				name: 'primaryEmail',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['household'],
						operation: ['create', 'update'],
					},
				},
				description: 'Primary email address',
			},
			{
				displayName: 'Primary Phone',
				name: 'primaryPhone',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['household'],
						operation: ['create', 'update'],
					},
				},
				description: 'Primary phone number',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['profile', 'household'],
						operation: ['list'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				displayOptions: {
					show: {
						resource: ['profile', 'household'],
						operation: ['list'],
						returnAll: [false],
					},
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['profile'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
						description: 'Filter by email',
					},
					{
						displayName: 'First Name',
						name: 'first_name',
						type: 'string',
						default: '',
						description: 'Filter by first name',
					},
					{
						displayName: 'Last Name',
						name: 'last_name',
						type: 'string',
						default: '',
						description: 'Filter by last name',
					},
					{
						displayName: 'External ID',
						name: 'external_id',
						type: 'string',
						default: '',
						description: 'Filter by external ID',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const credentials = await this.getCredentials('subsplashApi');
				const baseUrl = (credentials?.baseUrl as string) || 'https://core.subsplash.com';
				const appKey = (credentials?.appKey as string) || '';
				const orgKey = (credentials?.orgKey as string) || appKey;

				if (!appKey) {
					throw new NodeOperationError(
						this.getNode(),
						'App Key is required in credentials',
						{ itemIndex },
					);
				}

				if (resource === 'profile') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
						const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
						const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;

						const response = await SubsplashPeople.listProfiles(
							this,
							baseUrl,
							appKey,
							orgKey,
							returnAll,
							limit,
							filters,
							itemIndex,
						);

						const profiles = response._embedded?.profiles || [];
						for (const profile of profiles) {
							returnData.push({
								json: profile as unknown as IDataObject,
								binary: items[itemIndex].binary,
							});
						}
					} else if (operation === 'get') {
						const profileId = this.getNodeParameter('profileId', itemIndex) as string;

						const response = await SubsplashPeople.getProfile(
							this,
							baseUrl,
							profileId,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					} else if (operation === 'create') {
						const requestBody = await SubsplashPeople.buildProfileBody(
							this,
							orgKey,
							itemIndex,
						);

						const response = await SubsplashPeople.createProfile(
							this,
							baseUrl,
							requestBody,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					} else if (operation === 'update') {
						const profileId = this.getNodeParameter('profileId', itemIndex) as string;
						const requestBody = await SubsplashPeople.buildProfileBody(
							this,
							orgKey,
							itemIndex,
						);

						const response = await SubsplashPeople.updateProfile(
							this,
							baseUrl,
							profileId,
							requestBody,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					}
				} else if (resource === 'household') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
						const limit = this.getNodeParameter('limit', itemIndex, 50) as number;

						const response = await SubsplashPeople.listHouseholds(
							this,
							baseUrl,
							appKey,
							orgKey,
							returnAll,
							limit,
							itemIndex,
						);

						const households = response._embedded?.households || [];
						for (const household of households) {
							returnData.push({
								json: household as unknown as IDataObject,
								binary: items[itemIndex].binary,
							});
						}
					} else if (operation === 'get') {
						const householdId = this.getNodeParameter('householdId', itemIndex) as string;

						const response = await SubsplashPeople.getHousehold(
							this,
							baseUrl,
							householdId,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					} else if (operation === 'create') {
						const requestBody = await SubsplashPeople.buildHouseholdBody(
							this,
							orgKey,
							itemIndex,
						);

						const response = await SubsplashPeople.createHousehold(
							this,
							baseUrl,
							requestBody,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					} else if (operation === 'update') {
						const householdId = this.getNodeParameter('householdId', itemIndex) as string;
						const requestBody = await SubsplashPeople.buildHouseholdBody(
							this,
							orgKey,
							itemIndex,
						);

						const response = await SubsplashPeople.updateHousehold(
							this,
							baseUrl,
							householdId,
							requestBody,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					} else if (operation === 'delete') {
						const householdId = this.getNodeParameter('householdId', itemIndex) as string;

						await SubsplashPeople.deleteHousehold(
							this,
							baseUrl,
							householdId,
							itemIndex,
						);

						returnData.push({
							json: { success: true, id: householdId },
							binary: items[itemIndex].binary,
						});
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error instanceof Error ? error.message : String(error) },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}

	// Profile methods
	private static async listProfiles(
		context: IExecuteFunctions,
		baseUrl: string,
		appKey: string,
		orgKey: string,
		returnAll: boolean,
		limit: number,
		filters: IDataObject,
		itemIndex: number,
	): Promise<{ _embedded?: { profiles?: ProfileResponse[] } }> {
		const qs: IDataObject = {};
		
		// Only add org_key filter if orgKey is provided and different from appKey
		// Some orgs may not require this filter, or it may be inferred from token
		if (orgKey && orgKey !== appKey) {
			qs['filter[org_key]'] = orgKey;
		}

		if (filters.email) {
			qs['filter[email]'] = filters.email;
		}
		if (filters.first_name) {
			qs['filter[first_name]'] = filters.first_name;
		}
		if (filters.last_name) {
			qs['filter[last_name]'] = filters.last_name;
		}
		if (filters.external_id) {
			qs['filter[external_id]'] = filters.external_id;
		}

		if (!returnAll) {
			qs['page[size]'] = limit;
			qs['page[number]'] = 0;
		} else {
			qs['page[size]'] = 100;
		}

		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/people/v1/profiles`,
			headers: {
				Accept: 'application/vnd.api+json',
			},
			qs,
			json: true,
		};

		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'subsplashApi',
				options,
			);
			return response as { _embedded?: { profiles?: ProfileResponse[] } };
		} catch (error) {
			const errorMessage = SubsplashPeople.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to list profiles: ${errorMessage}`,
			});
		}
	}

	private static async getProfile(
		context: IExecuteFunctions,
		baseUrl: string,
		profileId: string,
		itemIndex: number,
	): Promise<ProfileResponse> {
		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/people/v1/profiles/${profileId}`,
			headers: {
				Accept: 'application/vnd.api+json',
			},
			json: true,
		};

		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'subsplashApi',
				options,
			);
			return response as ProfileResponse;
		} catch (error) {
			const errorMessage = SubsplashPeople.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to get profile: ${errorMessage}`,
			});
		}
	}

	private static async buildProfileBody(
		context: IExecuteFunctions,
		orgKey: string,
		itemIndex: number,
	): Promise<IDataObject> {
		const requestBody: IDataObject = {
			org_key: orgKey,
		};

		const firstName = context.getNodeParameter('firstName', itemIndex) as string;
		if (firstName) {
			if (firstName.length > 35) {
				throw new NodeOperationError(
					context.getNode(),
					'First name exceeds maximum length of 35 characters',
					{ itemIndex },
				);
			}
			requestBody.first_name = firstName;
		}

		const lastName = context.getNodeParameter('lastName', itemIndex) as string;
		if (lastName) {
			if (lastName.length > 35) {
				throw new NodeOperationError(
					context.getNode(),
					'Last name exceeds maximum length of 35 characters',
					{ itemIndex },
				);
			}
			requestBody.last_name = lastName;
		}

		const email = context.getNodeParameter('email', itemIndex, '') as string;
		if (email) {
			requestBody.email = email;
		}

		const phoneNumber = context.getNodeParameter('phoneNumber', itemIndex, '') as string;
		if (phoneNumber) {
			requestBody.phone = {
				number: phoneNumber,
			};
		}

		const dateOfBirth = context.getNodeParameter('dateOfBirth', itemIndex, '') as string;
		if (dateOfBirth) {
			// Convert to date format (YYYY-MM-DD)
			const date = new Date(dateOfBirth);
			requestBody.date_of_birth = date.toISOString().split('T')[0];
		}

		const gender = context.getNodeParameter('gender', itemIndex, '') as string;
		if (gender) {
			requestBody.gender = gender;
		}

		const externalId = context.getNodeParameter('externalId', itemIndex, '') as string;
		if (externalId) {
			if (externalId.length > 50) {
				throw new NodeOperationError(
					context.getNode(),
					'External ID exceeds maximum length of 50 characters',
					{ itemIndex },
				);
			}
			requestBody.external_id = externalId;
		}

		const householdId = context.getNodeParameter('householdId', itemIndex, '') as string;
		const householdRole = context.getNodeParameter('householdRole', itemIndex, '') as string;
		if (householdId) {
			if (!requestBody._embedded) {
				requestBody._embedded = {};
			}
			(requestBody._embedded as IDataObject).household = {
				id: householdId,
			};
			if (householdRole) {
				requestBody.household_role = householdRole;
			}
		}

		return requestBody;
	}

	private static async createProfile(
		context: IExecuteFunctions,
		baseUrl: string,
		requestBody: IDataObject,
		itemIndex: number,
	): Promise<ProfileResponse> {
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/people/v1/profiles`,
			headers: {
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			body: requestBody,
			json: true,
		};

		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'subsplashApi',
				options,
			);
			return response as ProfileResponse;
		} catch (error) {
			const errorMessage = SubsplashPeople.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to create profile: ${errorMessage}`,
			});
		}
	}

	private static async updateProfile(
		context: IExecuteFunctions,
		baseUrl: string,
		profileId: string,
		requestBody: IDataObject,
		itemIndex: number,
	): Promise<ProfileResponse> {
		const options: IHttpRequestOptions = {
			method: 'PATCH',
			url: `${baseUrl}/people/v1/profiles/${profileId}`,
			headers: {
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			body: requestBody,
			json: true,
		};

		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'subsplashApi',
				options,
			);
			return response as ProfileResponse;
		} catch (error) {
			const errorMessage = SubsplashPeople.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to update profile: ${errorMessage}`,
			});
		}
	}

	// Household methods
	private static async listHouseholds(
		context: IExecuteFunctions,
		baseUrl: string,
		appKey: string,
		orgKey: string,
		returnAll: boolean,
		limit: number,
		itemIndex: number,
	): Promise<{ _embedded?: { households?: HouseholdResponse[] } }> {
		const qs: IDataObject = {};
		
		// Only add org_key filter if orgKey is provided and different from appKey
		// Some orgs may not require this filter, or it may be inferred from token
		if (orgKey && orgKey !== appKey) {
			qs['filter[org_key]'] = orgKey;
		}

		if (!returnAll) {
			qs['page[size]'] = limit;
			qs['page[number]'] = 0;
		} else {
			qs['page[size]'] = 100;
		}

		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/people/v1/households`,
			headers: {
				Accept: 'application/vnd.api+json',
			},
			qs,
			json: true,
		};

		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'subsplashApi',
				options,
			);
			return response as { _embedded?: { households?: HouseholdResponse[] } };
		} catch (error) {
			const errorMessage = SubsplashPeople.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to list households: ${errorMessage}`,
			});
		}
	}

	private static async getHousehold(
		context: IExecuteFunctions,
		baseUrl: string,
		householdId: string,
		itemIndex: number,
	): Promise<HouseholdResponse> {
		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/people/v1/households/${householdId}`,
			headers: {
				Accept: 'application/vnd.api+json',
			},
			json: true,
		};

		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'subsplashApi',
				options,
			);
			return response as HouseholdResponse;
		} catch (error) {
			const errorMessage = SubsplashPeople.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to get household: ${errorMessage}`,
			});
		}
	}

	private static async buildHouseholdBody(
		context: IExecuteFunctions,
		orgKey: string,
		itemIndex: number,
	): Promise<IDataObject> {
		const requestBody: IDataObject = {
			org_key: orgKey,
		};

		const name = context.getNodeParameter('name', itemIndex) as string;
		if (name) {
			if (name.length > 100) {
				throw new NodeOperationError(
					context.getNode(),
					'Household name exceeds maximum length of 100 characters',
					{ itemIndex },
				);
			}
			requestBody.name = name;
		}

		const primaryEmail = context.getNodeParameter('primaryEmail', itemIndex, '') as string;
		if (primaryEmail) {
			requestBody.primary_email = primaryEmail;
		}

		const primaryPhone = context.getNodeParameter('primaryPhone', itemIndex, '') as string;
		if (primaryPhone) {
			requestBody.primary_phone = {
				number: primaryPhone,
			};
		}

		return requestBody;
	}

	private static async createHousehold(
		context: IExecuteFunctions,
		baseUrl: string,
		requestBody: IDataObject,
		itemIndex: number,
	): Promise<HouseholdResponse> {
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/people/v1/households`,
			headers: {
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			body: requestBody,
			json: true,
		};

		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'subsplashApi',
				options,
			);
			return response as HouseholdResponse;
		} catch (error) {
			const errorMessage = SubsplashPeople.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to create household: ${errorMessage}`,
			});
		}
	}

	private static async updateHousehold(
		context: IExecuteFunctions,
		baseUrl: string,
		householdId: string,
		requestBody: IDataObject,
		itemIndex: number,
	): Promise<HouseholdResponse> {
		const options: IHttpRequestOptions = {
			method: 'PATCH',
			url: `${baseUrl}/people/v1/households/${householdId}`,
			headers: {
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			body: requestBody,
			json: true,
		};

		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'subsplashApi',
				options,
			);
			return response as HouseholdResponse;
		} catch (error) {
			const errorMessage = SubsplashPeople.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to update household: ${errorMessage}`,
			});
		}
	}

	private static async deleteHousehold(
		context: IExecuteFunctions,
		baseUrl: string,
		householdId: string,
		itemIndex: number,
	): Promise<void> {
		const options: IHttpRequestOptions = {
			method: 'DELETE',
			url: `${baseUrl}/people/v1/households/${householdId}`,
			headers: {
				Accept: 'application/vnd.api+json',
			},
			json: true,
		};

		try {
			await context.helpers.httpRequestWithAuthentication.call(context, 'subsplashApi', options);
		} catch (error) {
			const errorMessage = SubsplashPeople.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to delete household: ${errorMessage}`,
			});
		}
	}

	private static extractErrorMessage(context: IExecuteFunctions, error: unknown): string {
		if (error && typeof error === 'object' && 'response' in error) {
			const errorResponse = error as {
				response?: {
					statusCode?: number;
					status?: number;
					request?: { url?: string };
					body?: unknown;
					data?: unknown;
				};
				config?: { url?: string };
			};
			if (errorResponse.response) {
				const status = errorResponse.response.statusCode || errorResponse.response.status;
				const url =
					errorResponse.response.request?.url || errorResponse.config?.url || 'unknown endpoint';
				const body = errorResponse.response.body || errorResponse.response.data;
				let bodySnippet = '';
				if (body) {
					const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
					bodySnippet = bodyStr.substring(0, 1000);
				}
				return `Endpoint ${url} returned status ${status}${bodySnippet ? `: ${bodySnippet}` : ''}`;
			}
		}
		if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
			return error.message;
		}
		return String(error);
	}
}

