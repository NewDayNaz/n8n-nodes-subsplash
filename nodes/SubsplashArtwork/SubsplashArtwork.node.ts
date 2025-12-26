import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

interface SourceImageResponse {
	id: string;
	_links: {
		presigned_upload_url: {
			href: string;
		};
	};
}

interface TypedImageResponse {
	id: string;
	type: string;
}

interface MediaItemResponse {
	id: string;
	_embedded?: {
		images?: Array<{ id: string; type: string }>;
	};
}

export class SubsplashArtwork implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Subsplash Artwork: Upload & Attach',
		name: 'subsplashArtwork',
		icon: { light: 'file:../../icons/subsplash.svg', dark: 'file:../../icons/subsplash.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Upload artwork to Subsplash and assign it to a media item',
		defaults: {
			name: 'Subsplash Artwork: Upload & Attach',
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
						name: 'Upload & Assign Artwork',
						value: 'uploadAndAssignArtwork',
						description: 'Upload artwork and assign it to a media item',
						action: 'Upload and assign artwork',
					},
				],
				default: 'uploadAndAssignArtwork',
			},
			{
				displayName: 'Media Item ID',
				name: 'mediaItemId',
				type: 'string',
				required: true,
				default: '',
				description: 'Target media item UUID to assign artwork to',
			},
			{
				displayName: 'Image Binary Property',
				name: 'imageBinaryProperty',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property containing the image data',
			},
			{
				displayName: 'Content Type',
				name: 'contentType',
				type: 'options',
				options: [
					{
						name: 'PNG',
						value: 'image/png',
					},
					{
						name: 'JPEG',
						value: 'image/jpeg',
					},
				],
				default: 'image/png',
				description: 'Content type of the image',
			},
			{
				displayName: 'Image Types to Create',
				name: 'createTypes',
				type: 'multiOptions',
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
				default: ['wide', 'square', 'banner'],
				description: 'Which typed images to create from the source',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title for the image (defaults to filename if available)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (operation === 'uploadAndAssignArtwork') {
					// Get App Key and base URL from credentials
					const credentials = await this.getCredentials('subsplashApi');
					const appKey = (credentials?.appKey as string) || '';
					const baseUrl = (credentials?.baseUrl as string) || 'https://core.subsplash.com';
					if (!appKey) {
						throw new NodeOperationError(this.getNode(), 'App Key is required in credentials', {
							itemIndex,
						});
					}
					const mediaItemId = this.getNodeParameter('mediaItemId', itemIndex) as string;
					const imageBinaryProperty = this.getNodeParameter(
						'imageBinaryProperty',
						itemIndex,
					) as string;
					const contentType = this.getNodeParameter('contentType', itemIndex) as string;
					const createTypes = this.getNodeParameter('createTypes', itemIndex) as string[];
					let title = this.getNodeParameter('title', itemIndex) as string;

					// Get binary data
					const binaryData = this.helpers.assertBinaryData(itemIndex, imageBinaryProperty);
					const imageData = await this.helpers.getBinaryDataBuffer(itemIndex, imageBinaryProperty);

					// Use filename as title if title is empty
					if (!title && binaryData.fileName) {
						title = binaryData.fileName;
					} else if (!title) {
						title = contentType === 'image/png' ? 'upload.png' : 'upload.jpg';
					}

					// Step 1: Create source image
					const sourceImage = await this.createSourceImage(
						baseUrl,
						appKey,
						contentType,
						title,
						itemIndex,
					);

					const sourceId = sourceImage.id;
					const presignedUrl = sourceImage._links.presigned_upload_url.href;

					// Step 2: Upload to S3
					await this.uploadToS3(presignedUrl, imageData, contentType, itemIndex);

					// Step 3: Create typed images
					const created: IDataObject = {};
					const imageIds: Array<{ id: string; type: string }> = [];
					let typedImageCreationFailed = false;

					for (const type of createTypes) {
						try {
							const typedImage = await this.createTypedImage(
								baseUrl,
								appKey,
								contentType,
								title,
								type,
								sourceId,
								itemIndex,
							);
							const typedId = typedImage.id;
							created[`${type}Id`] = typedId;
							imageIds.push({ id: typedId, type });
						} catch (error) {
							// Collect partial successes, but mark failure
							typedImageCreationFailed = true;
							// Continue to collect other successes, but we'll stop before PATCH
						}
					}

					// Step 4: Patch media item (only if all typed images were created successfully)
					let assigned = false;
					if (!typedImageCreationFailed && imageIds.length > 0) {
						try {
							await this.patchMediaItem(baseUrl, mediaItemId, imageIds, itemIndex);
							assigned = true;
						} catch (error) {
							// Return created IDs even if assignment fails
							const errorMessage = this.extractErrorMessage(error);
							throw new NodeOperationError(this.getNode(), error, {
								itemIndex,
								description: `Failed to assign images to media item: ${errorMessage}`,
							});
						}
					} else if (typedImageCreationFailed) {
						// If typed image creation failed, return partial results with assigned: false
						// Don't throw, just return with assigned: false
						// The error will be logged but execution continues
					}

					// Step 5: Verify (optional HEAD request)
					let verifyStatus: number | null = null;
					let verifyUrl: string | null = null;
					if (imageIds.length > 0) {
						const firstImageId = imageIds[0].id;
						verifyUrl = `https://images.subsplash.com/image.jpg?id=${firstImageId}&w=100&h=100`;
						try {
							const verifyResponse = await this.helpers.httpRequest({
								method: 'HEAD',
								url: verifyUrl,
								returnFullResponse: true,
							});
							verifyStatus = verifyResponse.statusCode || null;
						} catch (error) {
							// Verification failure is non-fatal, continue execution
						}
					}

					// Prepare output
					const outputItem: INodeExecutionData = {
						json: {
							mediaItemId,
							sourceImageId: sourceId,
							created,
							assigned,
							...(verifyUrl && { verify: { url: verifyUrl, status: verifyStatus } }),
						},
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

	private async createSourceImage(
		baseUrl: string,
		appKey: string,
		contentType: string,
		title: string,
		itemIndex: number,
	): Promise<SourceImageResponse> {
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/files/v1/images`,
			headers: {
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			body: {
				app_key: appKey,
				content_type: contentType,
				title,
				type: 'source',
			},
			json: true,
		};

		try {
			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'subsplashApi',
				options,
			);
			return response as SourceImageResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(error);
			throw new NodeOperationError(this.getNode(), error, {
				itemIndex,
				description: `Failed to create source image: ${errorMessage}`,
			});
		}
	}

	private async uploadToS3(
		presignedUrl: string,
		imageData: Buffer,
		contentType: string,
		itemIndex: number,
	): Promise<void> {
		const options: IHttpRequestOptions = {
			method: 'PUT',
			url: presignedUrl,
			headers: {
				'Content-Type': contentType,
				'x-amz-acl': 'public-read',
				Origin: 'https://dashboard.subsplash.com',
			},
			body: imageData,
			returnFullResponse: true,
			json: false,
		};

		try {
			const response = await this.helpers.httpRequest(options);
			const statusCode = response.statusCode || (response as any).status;
			if (statusCode && (statusCode < 200 || statusCode >= 300)) {
				throw new Error(`S3 upload returned status ${statusCode}`);
			}
		} catch (error) {
			const errorMessage = this.extractErrorMessage(error);
			const errorObj = new Error(`S3UploadError: ${errorMessage}`);
			(errorObj as any).name = 'S3UploadError';
			throw new NodeOperationError(this.getNode(), errorObj, {
				itemIndex,
				description: `S3 upload failed: ${errorMessage}`,
			});
		}
	}

	private async createTypedImage(
		baseUrl: string,
		appKey: string,
		contentType: string,
		title: string,
		type: string,
		sourceId: string,
		itemIndex: number,
	): Promise<TypedImageResponse> {
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/files/v1/images`,
			headers: {
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			body: {
				app_key: appKey,
				content_type: contentType,
				title,
				type,
				_embedded: {
					source: {
						id: sourceId,
						type: 'source',
					},
				},
			},
			json: true,
		};

		try {
			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'subsplashApi',
				options,
			);
			return response as TypedImageResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(error);
			throw new NodeOperationError(this.getNode(), error, {
				itemIndex,
				description: `Failed to create typed image "${type}": ${errorMessage}`,
			});
		}
	}

	private async patchMediaItem(
		baseUrl: string,
		mediaItemId: string,
		imageIds: Array<{ id: string; type: string }>,
		itemIndex: number,
	): Promise<MediaItemResponse> {
		const options: IHttpRequestOptions = {
			method: 'PATCH',
			url: `${baseUrl}/media/v1/media-items/${mediaItemId}`,
			headers: {
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
			},
			body: {
				id: mediaItemId,
				_embedded: {
					images: imageIds,
				},
			},
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
				description: `Failed to patch media item: ${errorMessage}`,
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

