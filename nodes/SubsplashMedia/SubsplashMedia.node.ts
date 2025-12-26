import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

interface MediaItemResponse {
	id: string;
	title?: string;
	subtitle?: string;
	summary?: string;
	date?: string;
	tags?: string[];
	_embedded?: {
		images?: Array<{ id: string; type: string }>;
	};
}

export class SubsplashMedia implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Subsplash Media',
		name: 'subsplashMedia',
		icon: { light: 'file:../../icons/subsplash.svg', dark: 'file:../../icons/subsplash.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Subsplash Media Items API',
		defaults: {
			name: 'Subsplash Media',
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
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new media item',
						action: 'Create a media item',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a media item',
						action: 'Delete a media item',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a media item by ID',
						action: 'Get a media item',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List and filter media items',
						action: 'List media items',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an existing media item',
						action: 'Update a media item',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Media Item ID',
				name: 'mediaItemId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'Subsplash media item ID',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
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
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'App Key',
						name: 'app_key',
						type: 'string',
						default: '',
						description: 'Filter by app key',
					},
					{
						displayName: 'Media Series ID',
						name: 'media_series',
						type: 'string',
						default: '',
						description: 'Filter by media series UUID',
					},
					{
						displayName: 'Speaker',
						name: 'speaker',
						type: 'string',
						default: '',
						description: 'Filter by speaker (supports wildcards *)',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Draft',
								value: 'draft',
							},
							{
								name: 'Scheduled',
								value: 'scheduled',
							},
							{
								name: 'Published',
								value: 'published',
							},
						],
						default: 'draft',
						description: 'Filter by status',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						description: 'Filter by title (supports wildcards *)',
					},
					{
						displayName: 'Unlisted',
						name: 'unlisted',
						type: 'options',
						options: [
							{
								name: 'None',
								value: '',
								description: 'Do not filter by unlisted status',
							},
							{
								name: 'Include Unlisted',
								value: 'include',
								description: 'Include unlisted items in results',
							},
						],
						default: '',
						description: 'Set to "Include Unlisted" to include unlisted media items in results',
					},
					{
						displayName: 'Upcoming Live',
						name: 'upcoming_live',
						type: 'boolean',
						default: false,
						description: 'Whether to filter for upcoming live events',
					},
				],
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				options: [
					{
						name: 'Created Date (Newest First)',
						value: '-created_at',
					},
					{
						name: 'Created Date (Oldest First)',
						value: 'created_at',
					},
					{
						name: 'Published Date (Newest First)',
						value: '-published_at',
					},
					{
						name: 'Published Date (Oldest First)',
						value: 'published_at',
					},
					{
						name: 'Title (A-Z)',
						value: 'title',
					},
					{
						name: 'Title (Z-A)',
						value: '-title',
					},
					{
						name: 'Updated Date (Newest First)',
						value: '-updated_at',
					},
					{
						name: 'Updated Date (Oldest First)',
						value: 'updated_at',
					},
				],
				default: '-published_at',
				description: 'Sort order for results',
			},
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				displayOptions: {
					show: {
						operation: ['get', 'list', 'create', 'update'],
					},
				},
				options: [
					{
						name: 'Audio',
						value: 'audio',
					},
					{
						name: 'Broadcast',
						value: 'broadcast',
					},
					{
						name: 'Document',
						value: 'document',
					},
					{
						name: 'Images',
						value: 'images',
					},
					{
						name: 'Live Template',
						value: 'live-template',
					},
					{
						name: 'Media Series',
						value: 'media-series',
					},
					{
						name: 'Notification',
						value: 'notification',
					},
					{
						name: 'Video',
						value: 'video',
					},
				],
				default: [],
				description: 'Include related resources in response',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Media item title',
			},
			{
				displayName: 'Subtitle',
				name: 'subtitle',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Media item subtitle',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Media item description/summary',
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Media item date',
			},
			{
				displayName: 'Speakers',
				name: 'speakers',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Comma-separated speaker names (max 3). Will be formatted as "speaker:Name" tags.',
				placeholder: 'John Doe, Jane Smith',
			},
			{
				displayName: 'Topics',
				name: 'topics',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Comma-separated topics (max 10). Will be formatted as "topic:Name" tags.',
				placeholder: 'Faith, Hope, Love',
			},
			{
				displayName: 'Scriptures (OSIS)',
				name: 'scriptures',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Comma-separated OSIS scripture references (e.g., "Gen.1.1,John.3.16")',
				placeholder: 'Gen.1.1,John.3.16',
			},
			{
				displayName: 'Speaker',
				name: 'speaker',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Primary speaker name (single value, not tags)',
			},
			{
				displayName: 'External Audio URL',
				name: 'externalAudioUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'External audio URL for the media item',
			},
			{
				displayName: 'External Video URL',
				name: 'externalVideoUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'External video URL for the media item',
			},
			{
				displayName: 'Auto Publish',
				name: 'autoPublish',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Whether to automatically publish the media item',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{
						name: 'Draft',
						value: 'draft',
					},
					{
						name: 'Scheduled',
						value: 'scheduled',
					},
					{
						name: 'Published',
						value: 'published',
					},
				],
				default: 'draft',
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Publishing status of the media item. Note: "unlisted" is a filter option, not a status value.',
			},
			{
				displayName: 'Images',
				name: 'images',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				displayOptions: {
					show: {
						operation: ['create', 'update'],
					},
				},
				description: 'Images to assign to the media item',
				options: [
					{
						name: 'image',
						displayName: 'Image',
						values: [
							{
								displayName: 'Subsplash Image ID',
								name: 'subsplashId',
								type: 'string',
								default: '',
								required: true,

							},
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'Wide',
										value: 'wide',
									},
									{
										name: 'Square',
										value: 'square',
									},
									{
										name: 'Banner',
										value: 'banner',
									},
								],
								default: 'square',
								required: true,
							},
						],
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
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const credentials = await this.getCredentials('subsplashApi');
				const baseUrl = (credentials?.baseUrl as string) || 'https://core.subsplash.com';
				const appKey = (credentials?.appKey as string) || '';

				if (!appKey) {
					throw new NodeOperationError(this.getNode(), 'App Key is required in credentials', {
						itemIndex,
					});
				}

				if (operation === 'get') {
					const mediaItemId = this.getNodeParameter('mediaItemId', itemIndex) as string;
					const include = this.getNodeParameter('include', itemIndex, []) as string[];

					const response = await SubsplashMedia.getMediaItem(
						this,
						baseUrl,
						mediaItemId,
						include,
						itemIndex,
					);

					const outputItem: INodeExecutionData = {
						json: response as unknown as IDataObject,
						binary: items[itemIndex].binary,
					};

					returnData.push(outputItem);
				} else if (operation === 'list') {
					const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
					const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
					const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
					const sort = this.getNodeParameter('sort', itemIndex, '-published_at') as string;
					const include = this.getNodeParameter('include', itemIndex, []) as string[];

					const response = await SubsplashMedia.listMediaItems(
						this,
						baseUrl,
						appKey,
						returnAll,
						limit,
						filters,
						sort,
						include,
						itemIndex,
					);

					const mediaItems = response._embedded?.['media-items'] || [];
					for (const item of mediaItems) {
						returnData.push({
							json: item as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					}
				} else if (operation === 'create') {
					// Get all the same fields as update
					const requestBody = await SubsplashMedia.buildMediaItemBody(
						this,
						appKey,
						itemIndex,
					);

					const include = this.getNodeParameter('include', itemIndex, []) as string[];

					const response = await SubsplashMedia.createMediaItem(
						this,
						baseUrl,
						requestBody,
						include,
						itemIndex,
					);

					const outputItem: INodeExecutionData = {
						json: response as unknown as IDataObject,
						binary: items[itemIndex].binary,
					};

					returnData.push(outputItem);
				} else if (operation === 'update') {
					const mediaItemId = this.getNodeParameter('mediaItemId', itemIndex) as string;
					const requestBody = await SubsplashMedia.buildMediaItemBody(
						this,
						appKey,
						itemIndex,
					);
					const include = this.getNodeParameter('include', itemIndex, []) as string[];

					const response = await SubsplashMedia.updateMediaItem(
						this,
						baseUrl,
						mediaItemId,
						requestBody,
						include,
						itemIndex,
					);

					const outputItem: INodeExecutionData = {
						json: response as unknown as IDataObject,
						binary: items[itemIndex].binary,
					};

					returnData.push(outputItem);
				} else if (operation === 'delete') {
					const mediaItemId = this.getNodeParameter('mediaItemId', itemIndex) as string;

					await SubsplashMedia.deleteMediaItem(
						this,
						baseUrl,
						mediaItemId,
						itemIndex,
					);

					returnData.push({
						json: { success: true, id: mediaItemId },
						binary: items[itemIndex].binary,
					});
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
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

	private static async buildMediaItemBody(
		context: IExecuteFunctions,
		appKey: string,
		itemIndex: number,
	): Promise<IDataObject> {
		const title = context.getNodeParameter('title', itemIndex, '') as string;
		const subtitle = context.getNodeParameter('subtitle', itemIndex, '') as string;
		const description = context.getNodeParameter('description', itemIndex, '') as string;
		const date = context.getNodeParameter('date', itemIndex, '') as string;
		const speakersStr = context.getNodeParameter('speakers', itemIndex, '') as string;
		const topicsStr = context.getNodeParameter('topics', itemIndex, '') as string;
		const scripturesStr = context.getNodeParameter('scriptures', itemIndex, '') as string;
		const speaker = context.getNodeParameter('speaker', itemIndex, '') as string;
		const externalAudioUrl = context.getNodeParameter('externalAudioUrl', itemIndex, '') as string;
		const externalVideoUrl = context.getNodeParameter('externalVideoUrl', itemIndex, '') as string;
		const autoPublish = context.getNodeParameter('autoPublish', itemIndex, false) as boolean;
		const status = context.getNodeParameter('status', itemIndex, '') as string;
		const imagesData = context.getNodeParameter('images', itemIndex, {}) as {
			image?: Array<{ subsplashId: string; type: string }>;
		};

		// Build tags from speakers and topics
		const tags: string[] = [];
		if (speakersStr) {
			const speakers = speakersStr
				.split(',')
				.map((s) => s.trim())
				.filter((s) => s.length > 0);
			if (speakers.length > 3) {
				throw new NodeOperationError(
					context.getNode(),
					'Too many speakers: Maximum 3 speakers allowed',
					{ itemIndex },
				);
			}
			tags.push(...speakers.map((s) => `speaker:${s}`));
		}
		if (topicsStr) {
			const topics = topicsStr
				.split(',')
				.map((t) => t.trim())
				.filter((t) => t.length > 0);
			if (topics.length > 10) {
				throw new NodeOperationError(
					context.getNode(),
					'Too many topics: Maximum 10 topics allowed',
					{ itemIndex },
				);
			}
			tags.push(...topics.map((topic) => `topic:${topic}`));
		}

		// Build images array (max 3 per OpenAPI spec)
		const images: Array<{ id: string; type: string }> = [];
		if (imagesData.image && Array.isArray(imagesData.image)) {
			for (const img of imagesData.image) {
				if (img.subsplashId && img.type) {
					images.push({
						id: img.subsplashId,
						type: img.type,
					});
				}
			}
			if (images.length > 3) {
				throw new NodeOperationError(
					context.getNode(),
					'Too many images: Maximum 3 images allowed per media item',
					{ itemIndex },
				);
			}
		}

		// Build scriptures array
		const scriptures: string[] = [];
		if (scripturesStr) {
			const scriptureList = scripturesStr
				.split(',')
				.map((s) => s.trim())
				.filter((s) => s.length > 0);
			scriptures.push(...scriptureList);
		}

		// Build request body - only include non-empty values
		const requestBody: IDataObject = {
			app_key: appKey,
		};

		if (title) {
			if (title.length > 100) {
				throw new NodeOperationError(
					context.getNode(),
					'Title exceeds maximum length of 100 characters',
					{ itemIndex },
				);
			}
			requestBody.title = title;
		}
		if (subtitle) {
			if (subtitle.length > 100) {
				throw new NodeOperationError(
					context.getNode(),
					'Subtitle exceeds maximum length of 100 characters',
					{ itemIndex },
				);
			}
			requestBody.subtitle = subtitle;
		}
		if (description) {
			requestBody.summary = description;
		}
		if (date) {
			requestBody.date = date;
		}
		if (speaker) {
			if (speaker.length > 200) {
				throw new NodeOperationError(
					context.getNode(),
					'Speaker exceeds maximum length of 200 characters',
					{ itemIndex },
				);
			}
			requestBody.speaker = speaker;
		}
		if (tags.length > 0) {
			requestBody.tags = tags;
		}
		if (scriptures.length > 0) {
			requestBody.scriptures = scriptures;
		}
		if (externalAudioUrl) {
			if (externalAudioUrl.length > 1024) {
				throw new NodeOperationError(
					context.getNode(),
					'External Audio URL exceeds maximum length of 1024 characters',
					{ itemIndex },
				);
			}
			requestBody.external_audio_url = externalAudioUrl;
		}
		if (externalVideoUrl) {
			if (externalVideoUrl.length > 1024) {
				throw new NodeOperationError(
					context.getNode(),
					'External Video URL exceeds maximum length of 1024 characters',
					{ itemIndex },
				);
			}
			requestBody.external_video_url = externalVideoUrl;
		}
		if (autoPublish !== undefined) {
			requestBody.auto_publish = autoPublish;
		}
		if (status) {
			requestBody.status = status;
		}
		if (images.length > 0) {
			requestBody._embedded = {
				images,
			};
		}

		return requestBody;
	}

	private static async getMediaItem(
		context: IExecuteFunctions,
		baseUrl: string,
		mediaItemId: string,
		include: string[],
		itemIndex: number,
	): Promise<MediaItemResponse> {
		const qs: IDataObject = {};
		if (include.length > 0) {
			qs.include = include.join(',');
		}

		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/media/v1/media-items/${mediaItemId}`,
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
			return response as MediaItemResponse;
		} catch (error) {
			const errorMessage = SubsplashMedia.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to get media item: ${errorMessage}`,
			});
		}
	}

	private static async listMediaItems(
		context: IExecuteFunctions,
		baseUrl: string,
		appKey: string,
		returnAll: boolean,
		limit: number,
		filters: IDataObject,
		sort: string,
		include: string[],
		itemIndex: number,
	): Promise<{ _embedded?: { 'media-items'?: MediaItemResponse[] }; total?: number }> {
		const qs: IDataObject = {
			'filter[app_key]': appKey,
		};

		// Add filters
		if (filters.app_key) {
			qs['filter[app_key]'] = filters.app_key;
		}
		if (filters.title) {
			qs['filter[title]'] = filters.title;
		}
		if (filters.speaker) {
			qs['filter[speaker]'] = filters.speaker;
		}
		if (filters.status) {
			qs['filter[status]'] = filters.status;
		}
		if (filters.media_series) {
			qs['filter[media_series]'] = filters.media_series;
		}
		if (filters.unlisted) {
			qs['filter[unlisted]'] = filters.unlisted;
		}
		if (filters.upcoming_live !== undefined) {
			qs['filter[upcoming_live]'] = filters.upcoming_live;
		}

		// Add sort
		if (sort) {
			qs.sort = sort;
		}

		// Add include
		if (include.length > 0) {
			qs.include = include.join(',');
		}

		// Add pagination
		if (!returnAll) {
			qs['page[size]'] = limit;
			qs['page[number]'] = 0;
		} else {
			qs['page[size]'] = 100; // Max per page
		}

		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/media/v1/media-items`,
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
			return response as { _embedded?: { 'media-items'?: MediaItemResponse[] }; total?: number };
		} catch (error) {
			const errorMessage = SubsplashMedia.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to list media items: ${errorMessage}`,
			});
		}
	}

	private static async createMediaItem(
		context: IExecuteFunctions,
		baseUrl: string,
		requestBody: IDataObject,
		include: string[],
		itemIndex: number,
	): Promise<MediaItemResponse> {
		const qs: IDataObject = {};
		if (include.length > 0) {
			qs.include = include.join(',');
		}

		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/media/v1/media-items`,
			headers: {
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			body: requestBody,
			qs,
			json: true,
		};

		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'subsplashApi',
				options,
			);
			return response as MediaItemResponse;
		} catch (error) {
			const errorMessage = SubsplashMedia.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to create media item: ${errorMessage}`,
			});
		}
	}

	private static async deleteMediaItem(
		context: IExecuteFunctions,
		baseUrl: string,
		mediaItemId: string,
		itemIndex: number,
	): Promise<void> {
		const options: IHttpRequestOptions = {
			method: 'DELETE',
			url: `${baseUrl}/media/v1/media-items/${mediaItemId}`,
			headers: {
				Accept: 'application/vnd.api+json',
			},
			json: true,
		};

		try {
			await context.helpers.httpRequestWithAuthentication.call(context, 'subsplashApi', options);
		} catch (error) {
			const errorMessage = SubsplashMedia.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to delete media item: ${errorMessage}`,
			});
		}
	}

	private static async updateMediaItem(
		context: IExecuteFunctions,
		baseUrl: string,
		mediaItemId: string,
		requestBody: IDataObject,
		include: string[],
		itemIndex: number,
	): Promise<MediaItemResponse> {
		const qs: IDataObject = {};
		if (include.length > 0) {
			qs.include = include.join(',');
		}

		const options: IHttpRequestOptions = {
			method: 'PATCH',
			url: `${baseUrl}/media/v1/media-items/${mediaItemId}`,
			headers: {
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			body: requestBody,
			qs,
			json: true,
		};

		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(
				context,
				'subsplashApi',
				options,
			);
			return response as MediaItemResponse;
		} catch (error) {
			const errorMessage = SubsplashMedia.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to update media item: ${errorMessage}`,
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
					bodySnippet = bodyStr.substring(0, 1000); // Limit to 1KB
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

