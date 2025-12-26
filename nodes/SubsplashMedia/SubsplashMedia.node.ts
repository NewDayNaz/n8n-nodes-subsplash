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
						name: 'Update Media Item',
						value: 'update',
						description: 'Update an existing media item (sermon)',
						action: 'Update a media item',
					},
				],
				default: 'update',
			},
			{
				displayName: 'Media Item ID',
				name: 'mediaItemId',
				type: 'string',
				required: true,
				default: '',
				description: 'Subsplash media item ID to update',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['update'],
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
						operation: ['update'],
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
						operation: ['update'],
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
						operation: ['update'],
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
						operation: ['update'],
					},
				},
				description: 'Comma-separated speaker names (max 3). Will be formatted as "speaker:Name" tags',
				placeholder: 'John Doe, Jane Smith',
			},
			{
				displayName: 'Topics',
				name: 'topics',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['update'],
					},
				},
				description: 'Comma-separated topics (max 10). Will be formatted as "topic:Name" tags',
				placeholder: 'Faith, Hope, Love',
			},
			{
				displayName: 'Scriptures (OSIS)',
				name: 'scriptures',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['update'],
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
						operation: ['update'],
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
						operation: ['update'],
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
						operation: ['update'],
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
						operation: ['update'],
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
						name: 'Published',
						value: 'published',
					},
					{
						name: 'Unlisted',
						value: 'unlisted',
					},
				],
				default: '',
				displayOptions: {
					show: {
						operation: ['update'],
					},
				},
				description: 'Publication status of the media item',
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
						operation: ['update'],
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
								description: 'Subsplash image ID',
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
								description: 'Image type',
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

				if (operation === 'update') {
					// Get credentials
					const credentials = await this.getCredentials('subsplashApi');
					const baseUrl = (credentials?.baseUrl as string) || 'https://core.subsplash.com';
					const appKey = (credentials?.appKey as string) || '';

					if (!appKey) {
						throw new NodeOperationError(this.getNode(), 'App Key is required in credentials', {
							itemIndex,
						});
					}

					const mediaItemId = this.getNodeParameter('mediaItemId', itemIndex) as string;
					const title = this.getNodeParameter('title', itemIndex, '') as string;
					const subtitle = this.getNodeParameter('subtitle', itemIndex, '') as string;
					const description = this.getNodeParameter('description', itemIndex, '') as string;
					const date = this.getNodeParameter('date', itemIndex, '') as string;
					const speakersStr = this.getNodeParameter('speakers', itemIndex, '') as string;
					const topicsStr = this.getNodeParameter('topics', itemIndex, '') as string;
					const scripturesStr = this.getNodeParameter('scriptures', itemIndex, '') as string;
					const speaker = this.getNodeParameter('speaker', itemIndex, '') as string;
					const externalAudioUrl = this.getNodeParameter('externalAudioUrl', itemIndex, '') as string;
					const externalVideoUrl = this.getNodeParameter('externalVideoUrl', itemIndex, '') as string;
					const autoPublish = this.getNodeParameter('autoPublish', itemIndex, false) as boolean;
					const status = this.getNodeParameter('status', itemIndex, '') as string;
					const imagesData = this.getNodeParameter('images', itemIndex, {}) as {
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
								this.getNode(),
								'Too many speakers: Maximum 3 speakers allowed',
								{ itemIndex },
							);
						}
						tags.push(...speakers.map((speaker) => `speaker:${speaker}`));
					}
					if (topicsStr) {
						const topics = topicsStr
							.split(',')
							.map((t) => t.trim())
							.filter((t) => t.length > 0);
						if (topics.length > 10) {
							throw new NodeOperationError(
								this.getNode(),
								'Too many topics: Maximum 10 topics allowed',
								{ itemIndex },
							);
						}
						tags.push(...topics.map((topic) => `topic:${topic}`));
					}

					// Build images array
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
						requestBody.title = title;
					}
					if (subtitle) {
						requestBody.subtitle = subtitle;
					}
					if (description) {
						requestBody.summary = description;
					}
					if (date) {
						requestBody.date = date;
					}
					if (speaker) {
						requestBody.speaker = speaker;
					}
					if (tags.length > 0) {
						requestBody.tags = tags;
					}
					if (scriptures.length > 0) {
						requestBody.scriptures = scriptures;
					}
					if (externalAudioUrl) {
						requestBody.external_audio_url = externalAudioUrl;
					}
					if (externalVideoUrl) {
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

					// Update media item
					const response = await this.updateMediaItem(
						baseUrl,
						mediaItemId,
						requestBody,
						itemIndex,
					);

					const outputItem: INodeExecutionData = {
						json: response as IDataObject,
						binary: items[itemIndex].binary,
					};

					returnData.push(outputItem);
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

	private async updateMediaItem(
		baseUrl: string,
		mediaItemId: string,
		requestBody: IDataObject,
		itemIndex: number,
	): Promise<MediaItemResponse> {
		const options: IHttpRequestOptions = {
			method: 'PATCH',
			url: `${baseUrl}/media/v1/media-items/${mediaItemId}`,
			headers: {
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			body: requestBody,
			json: true,
		};

		try {
			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'subsplashApi',
				options,
			);
			return response as MediaItemResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(error);
			throw new NodeOperationError(this.getNode(), error, {
				itemIndex,
				description: `Failed to update media item: ${errorMessage}`,
			});
		}
	}

	private extractErrorMessage(error: any): string {
		if (error.response) {
			const status = error.response.statusCode || error.response.status;
			const url = error.response.request?.url || error.config?.url || 'unknown endpoint';
			const body = error.response.body || error.response.data;
			let bodySnippet = '';
			if (body) {
				const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
				bodySnippet = bodyStr.substring(0, 1000); // Limit to 1KB
			}
			return `Endpoint ${url} returned status ${status}${bodySnippet ? `: ${bodySnippet}` : ''}`;
		}
		if (error.message) {
			return error.message;
		}
		return String(error);
	}
}

