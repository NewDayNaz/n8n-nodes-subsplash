import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

interface CalendarResponse {
	id: string;
	title: string;
	color: string;
	app_key: string;
	subtitle?: string;
	status?: string;
	published?: boolean;
	domain?: string;
	ical_url?: string;
	_embedded?: {
		images?: Array<{ id: string }>;
	};
}

interface EventResponse {
	id: string;
	title: string;
	app_key: string;
	start_at: string;
	end_at?: string;
	description?: string;
	subtitle?: string;
	status?: string;
	published?: boolean;
	all_day?: boolean;
	timezone?: string;
	location?: {
		id: string;
	};
	_embedded?: {
		calendar?: CalendarResponse;
		images?: Array<{ id: string }>;
		location?: { id: string };
	};
}

interface RepeatingEventResponse {
	id: string;
	title: string;
	app_key: string;
	description?: string;
	subtitle?: string;
	status?: string;
	_embedded?: {
		images?: Array<{ id: string }>;
	};
}

export class SubsplashEvents implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Subsplash Events',
		name: 'subsplashEvents',
		icon: { light: 'file:../../icons/subsplash.svg', dark: 'file:../../icons/subsplash.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"]}} - {{$parameter["operation"]}}',
		description: 'Manage Subsplash calendars, events, and repeating events',
		defaults: {
			name: 'Subsplash Events',
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
						name: 'Calendar',
						value: 'calendar',
					},
					{
						name: 'Event',
						value: 'event',
					},
					{
						name: 'Repeating Event',
						value: 'repeatingEvent',
					},
				],
				default: 'event',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['calendar'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a calendar',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a calendar',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a calendar',
					},
					{
						name: 'List',
						value: 'list',
						action: 'List calendars',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a calendar',
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
						resource: ['event'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create an event',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete an event',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get an event',
					},
					{
						name: 'List',
						value: 'list',
						action: 'List events',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update an event',
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
						resource: ['repeatingEvent'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a repeating event',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a repeating event',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a repeating event',
					},
					{
						name: 'List',
						value: 'list',
						action: 'List repeating events',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update a repeating event',
					},
				],
				default: 'list',
			},
			// Calendar fields
			{
				displayName: 'Calendar ID',
				name: 'calendarId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['calendar'],
						operation: ['get', 'update', 'delete'],
					},
				},

			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['calendar'],
						operation: ['create', 'update'],
					},
				},
				description: 'Calendar title',
			},
			{
				displayName: 'Color',
				name: 'color',
				type: 'color',
				required: true,
				default: '#000000',
				displayOptions: {
					show: {
						resource: ['calendar'],
						operation: ['create'],
					},
				},
				description: 'Hex color (e.g., #FF5733)',
			},
			{
				displayName: 'Subtitle',
				name: 'subtitle',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['calendar'],
						operation: ['create', 'update'],
					},
				},
				description: 'Calendar subtitle',
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
						resource: ['calendar'],
						operation: ['create', 'update'],
					},
				},
				description: 'Publishing status',
			},
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'options',
				options: [
					{
						name: 'General',
						value: 'general',
					},
					{
						name: 'Group',
						value: 'group',
					},
				],
				default: 'general',
				displayOptions: {
					show: {
						resource: ['calendar'],
						operation: ['create', 'update'],
					},
				},
				description: 'Calendar domain',
			},
			// Event fields
			{
				displayName: 'Event ID',
				name: 'eventId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['get', 'update', 'delete'],
					},
				},

			},
			{
				displayName: 'Calendar ID',
				name: 'calendarId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['create'],
					},
				},
				description: 'Calendar ID for this event',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['create', 'update'],
					},
				},
				description: 'Event title',
			},
			{
				displayName: 'Start Date/Time',
				name: 'startAt',
				type: 'dateTime',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['create', 'update'],
					},
				},
				description: 'Event start date and time',
			},
			{
				displayName: 'End Date/Time',
				name: 'endAt',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['create', 'update'],
					},
				},
				description: 'Event end date and time',
			},
			{
				displayName: 'All Day',
				name: 'allDay',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['create', 'update'],
					},
				},
				description: 'Whether this is an all-day event',
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
						resource: ['event'],
						operation: ['create', 'update'],
					},
				},
				description: 'Event description (HTML supported)',
			},
			{
				displayName: 'Subtitle',
				name: 'subtitle',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['create', 'update'],
					},
				},
				description: 'Event subtitle',
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
						resource: ['event'],
						operation: ['create', 'update'],
					},
				},
				description: 'Publishing status',
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['create', 'update'],
					},
				},
				description: 'IANA timezone (e.g., America/Los_Angeles)',
				placeholder: 'America/Los_Angeles',
			},
			{
				displayName: 'Location ID',
				name: 'locationId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['create', 'update'],
					},
				},
				description: 'Location UUID',
			},
			{
				displayName: 'Repeating Event ID',
				name: 'repeatingEventId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['repeatingEvent'],
						operation: ['get', 'update', 'delete'],
					},
				},

			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['repeatingEvent'],
						operation: ['create', 'update'],
					},
				},
				description: 'Repeating event title',
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
						resource: ['repeatingEvent'],
						operation: ['create', 'update'],
					},
				},
				description: 'Repeating event description',
			},
			{
				displayName: 'Subtitle',
				name: 'subtitle',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['repeatingEvent'],
						operation: ['create', 'update'],
					},
				},
				description: 'Repeating event subtitle',
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
						resource: ['repeatingEvent'],
						operation: ['create', 'update'],
					},
				},
				description: 'Publishing status',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['calendar', 'event', 'repeatingEvent'],
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
						resource: ['calendar', 'event', 'repeatingEvent'],
						operation: ['list'],
						returnAll: [false],
					},
				},
				default: 50,
				description: 'Max number of results to return',
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

				if (!appKey) {
					throw new NodeOperationError(this.getNode(), 'App Key is required in credentials', {
						itemIndex,
					});
				}

				if (resource === 'calendar') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
						const limit = this.getNodeParameter('limit', itemIndex, 50) as number;

						const response = await (this as unknown as SubsplashEvents).listCalendars(
							this,
							baseUrl,
							appKey,
							returnAll,
							limit,
							itemIndex,
						);

						const calendars = response._embedded?.calendars || [];
						for (const calendar of calendars) {
							returnData.push({
								json: calendar as unknown as IDataObject,
								binary: items[itemIndex].binary,
							});
						}
					} else if (operation === 'get') {
						const calendarId = this.getNodeParameter('calendarId', itemIndex) as string;

						const response = await (this as unknown as SubsplashEvents).getCalendar(
							this,
							baseUrl,
							calendarId,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					} else if (operation === 'create') {
						const requestBody = await (this as unknown as SubsplashEvents).buildCalendarBody(
							this,
							appKey,
							itemIndex,
						);

						const response = await (this as unknown as SubsplashEvents).createCalendar(
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
						const calendarId = this.getNodeParameter('calendarId', itemIndex) as string;
						const requestBody = await (this as unknown as SubsplashEvents).buildCalendarBody(
							this,
							appKey,
							itemIndex,
						);

						const response = await (this as unknown as SubsplashEvents).updateCalendar(
							this,
							baseUrl,
							calendarId,
							requestBody,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					} else if (operation === 'delete') {
						const calendarId = this.getNodeParameter('calendarId', itemIndex) as string;

						await (this as unknown as SubsplashEvents).deleteCalendar(
							this,
							baseUrl,
							calendarId,
							itemIndex,
						);

						returnData.push({
							json: { success: true, id: calendarId },
							binary: items[itemIndex].binary,
						});
					}
				} else if (resource === 'event') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
						const limit = this.getNodeParameter('limit', itemIndex, 50) as number;

						const response = await (this as unknown as SubsplashEvents).listEvents(
							this,
							baseUrl,
							appKey,
							returnAll,
							limit,
							itemIndex,
						);

						const events = response._embedded?.events || [];
						for (const event of events) {
							returnData.push({
								json: event as unknown as IDataObject,
								binary: items[itemIndex].binary,
							});
						}
					} else if (operation === 'get') {
						const eventId = this.getNodeParameter('eventId', itemIndex) as string;

						const response = await (this as unknown as SubsplashEvents).getEvent(
							this,
							baseUrl,
							eventId,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					} else if (operation === 'create') {
						const requestBody = await (this as unknown as SubsplashEvents).buildEventBody(
							this,
							appKey,
							itemIndex,
						);

						const response = await (this as unknown as SubsplashEvents).createEvent(
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
						const eventId = this.getNodeParameter('eventId', itemIndex) as string;
						const requestBody = await (this as unknown as SubsplashEvents).buildEventBody(
							this,
							appKey,
							itemIndex,
						);

						const response = await (this as unknown as SubsplashEvents).updateEvent(
							this,
							baseUrl,
							eventId,
							requestBody,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					} else if (operation === 'delete') {
						const eventId = this.getNodeParameter('eventId', itemIndex) as string;

						await (this as unknown as SubsplashEvents).deleteEvent(
							this,
							baseUrl,
							eventId,
							itemIndex,
						);

						returnData.push({
							json: { success: true, id: eventId },
							binary: items[itemIndex].binary,
						});
					}
				} else if (resource === 'repeatingEvent') {
					if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
						const limit = this.getNodeParameter('limit', itemIndex, 50) as number;

						const response = await (this as unknown as SubsplashEvents).listRepeatingEvents(
							this,
							baseUrl,
							appKey,
							returnAll,
							limit,
							itemIndex,
						);

						const repeatingEvents = response._embedded?.['repeating-events'] || [];
						for (const repeatingEvent of repeatingEvents) {
							returnData.push({
								json: repeatingEvent as unknown as IDataObject,
								binary: items[itemIndex].binary,
							});
						}
					} else if (operation === 'get') {
						const repeatingEventId = this.getNodeParameter('repeatingEventId', itemIndex) as string;

						const response = await (this as unknown as SubsplashEvents).getRepeatingEvent(
							this,
							baseUrl,
							repeatingEventId,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					} else if (operation === 'create') {
						const requestBody = await (this as unknown as SubsplashEvents).buildRepeatingEventBody(
							this,
							appKey,
							itemIndex,
						);

						const response = await (this as unknown as SubsplashEvents).createRepeatingEvent(
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
						const repeatingEventId = this.getNodeParameter('repeatingEventId', itemIndex) as string;
						const requestBody = await (this as unknown as SubsplashEvents).buildRepeatingEventBody(
							this,
							appKey,
							itemIndex,
						);

						const response = await (this as unknown as SubsplashEvents).updateRepeatingEvent(
							this,
							baseUrl,
							repeatingEventId,
							requestBody,
							itemIndex,
						);

						returnData.push({
							json: response as unknown as IDataObject,
							binary: items[itemIndex].binary,
						});
					} else if (operation === 'delete') {
						const repeatingEventId = this.getNodeParameter('repeatingEventId', itemIndex) as string;

						await (this as unknown as SubsplashEvents).deleteRepeatingEvent(
							this,
							baseUrl,
							repeatingEventId,
							itemIndex,
						);

						returnData.push({
							json: { success: true, id: repeatingEventId },
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

	// Calendar methods
	private async listCalendars(
		context: IExecuteFunctions,
		baseUrl: string,
		appKey: string,
		returnAll: boolean,
		limit: number,
		itemIndex: number,
	): Promise<{ _embedded?: { calendars?: CalendarResponse[] } }> {
		const qs: IDataObject = {
			'filter[app_key]': appKey,
		};

		if (!returnAll) {
			qs['page[size]'] = limit;
			qs['page[number]'] = 0;
		} else {
			qs['page[size]'] = 100;
		}

		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/events/v2/calendars`,
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
			return response as { _embedded?: { calendars?: CalendarResponse[] } };
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to list calendars: ${errorMessage}`,
			});
		}
	}

	private async getCalendar(
		context: IExecuteFunctions,
		baseUrl: string,
		calendarId: string,
		itemIndex: number,
	): Promise<CalendarResponse> {
		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/events/v2/calendars/${calendarId}`,
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
			return response as CalendarResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to get calendar: ${errorMessage}`,
			});
		}
	}

	private async buildCalendarBody(
		context: IExecuteFunctions,
		appKey: string,
		itemIndex: number,
	): Promise<IDataObject> {
		const requestBody: IDataObject = {
			app_key: appKey,
		};

		const title = context.getNodeParameter('title', itemIndex) as string;
		if (title) {
			requestBody.title = title;
		}

		const color = context.getNodeParameter('color', itemIndex, '') as string;
		if (color) {
			requestBody.color = color;
		}

		const subtitle = context.getNodeParameter('subtitle', itemIndex, '') as string;
		if (subtitle) {
			requestBody.subtitle = subtitle;
		}

		const status = context.getNodeParameter('status', itemIndex, '') as string;
		if (status) {
			requestBody.status = status;
		}

		const domain = context.getNodeParameter('domain', itemIndex, '') as string;
		if (domain) {
			requestBody.domain = domain;
		}

		return requestBody;
	}

	private async createCalendar(
		context: IExecuteFunctions,
		baseUrl: string,
		requestBody: IDataObject,
		itemIndex: number,
	): Promise<CalendarResponse> {
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/events/v2/calendars`,
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
			return response as CalendarResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to create calendar: ${errorMessage}`,
			});
		}
	}

	private async updateCalendar(
		context: IExecuteFunctions,
		baseUrl: string,
		calendarId: string,
		requestBody: IDataObject,
		itemIndex: number,
	): Promise<CalendarResponse> {
		const options: IHttpRequestOptions = {
			method: 'PATCH',
			url: `${baseUrl}/events/v2/calendars/${calendarId}`,
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
			return response as CalendarResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to update calendar: ${errorMessage}`,
			});
		}
	}

	private async deleteCalendar(
		context: IExecuteFunctions,
		baseUrl: string,
		calendarId: string,
		itemIndex: number,
	): Promise<void> {
		const options: IHttpRequestOptions = {
			method: 'DELETE',
			url: `${baseUrl}/events/v2/calendars/${calendarId}`,
			headers: {
				Accept: 'application/vnd.api+json',
			},
			json: true,
		};

		try {
			await context.helpers.httpRequestWithAuthentication.call(context, 'subsplashApi', options);
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to delete calendar: ${errorMessage}`,
			});
		}
	}

	// Event methods
	private async listEvents(
		context: IExecuteFunctions,
		baseUrl: string,
		appKey: string,
		returnAll: boolean,
		limit: number,
		itemIndex: number,
	): Promise<{ _embedded?: { events?: EventResponse[] } }> {
		const qs: IDataObject = {
			'filter[app_key]': appKey,
		};

		if (!returnAll) {
			qs['page[size]'] = limit;
			qs['page[number]'] = 0;
		} else {
			qs['page[size]'] = 100;
		}

		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/events/v2/events`,
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
			return response as { _embedded?: { events?: EventResponse[] } };
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to list events: ${errorMessage}`,
			});
		}
	}

	private async getEvent(
		context: IExecuteFunctions,
		baseUrl: string,
		eventId: string,
		itemIndex: number,
	): Promise<EventResponse> {
		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/events/v2/events/${eventId}`,
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
			return response as EventResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to get event: ${errorMessage}`,
			});
		}
	}

	private async buildEventBody(
		context: IExecuteFunctions,
		appKey: string,
		itemIndex: number,
	): Promise<IDataObject> {
		const requestBody: IDataObject = {
			app_key: appKey,
		};

		const calendarId = context.getNodeParameter('calendarId', itemIndex, '') as string;
		if (calendarId) {
			requestBody._embedded = {
				calendar: {
					id: calendarId,
				},
			};
		}

		const title = context.getNodeParameter('title', itemIndex) as string;
		if (title) {
			requestBody.title = title;
		}

		const startAt = context.getNodeParameter('startAt', itemIndex) as string;
		if (startAt) {
			requestBody.start_at = startAt;
		}

		const endAt = context.getNodeParameter('endAt', itemIndex, '') as string;
		if (endAt) {
			requestBody.end_at = endAt;
		}

		const allDay = context.getNodeParameter('allDay', itemIndex, false) as boolean;
		if (allDay !== undefined) {
			requestBody.all_day = allDay;
		}

		const description = context.getNodeParameter('description', itemIndex, '') as string;
		if (description) {
			requestBody.description = description;
		}

		const subtitle = context.getNodeParameter('subtitle', itemIndex, '') as string;
		if (subtitle) {
			requestBody.subtitle = subtitle;
		}

		const status = context.getNodeParameter('status', itemIndex, '') as string;
		if (status) {
			requestBody.status = status;
		}

		const timezone = context.getNodeParameter('timezone', itemIndex, '') as string;
		if (timezone) {
			requestBody.timezone = timezone;
		}

		const locationId = context.getNodeParameter('locationId', itemIndex, '') as string;
		if (locationId) {
			if (!requestBody._embedded) {
				requestBody._embedded = {};
			}
			(requestBody._embedded as IDataObject).location = {
				id: locationId,
			};
		}

		return requestBody;
	}

	private async createEvent(
		context: IExecuteFunctions,
		baseUrl: string,
		requestBody: IDataObject,
		itemIndex: number,
	): Promise<EventResponse> {
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/events/v2/events`,
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
			return response as EventResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to create event: ${errorMessage}`,
			});
		}
	}

	private async updateEvent(
		context: IExecuteFunctions,
		baseUrl: string,
		eventId: string,
		requestBody: IDataObject,
		itemIndex: number,
	): Promise<EventResponse> {
		const options: IHttpRequestOptions = {
			method: 'PATCH',
			url: `${baseUrl}/events/v2/events/${eventId}`,
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
			return response as EventResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to update event: ${errorMessage}`,
			});
		}
	}

	private async deleteEvent(
		context: IExecuteFunctions,
		baseUrl: string,
		eventId: string,
		itemIndex: number,
	): Promise<void> {
		const options: IHttpRequestOptions = {
			method: 'DELETE',
			url: `${baseUrl}/events/v2/events/${eventId}`,
			headers: {
				Accept: 'application/vnd.api+json',
			},
			json: true,
		};

		try {
			await context.helpers.httpRequestWithAuthentication.call(context, 'subsplashApi', options);
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to delete event: ${errorMessage}`,
			});
		}
	}

	// Repeating Event methods
	private async listRepeatingEvents(
		context: IExecuteFunctions,
		baseUrl: string,
		appKey: string,
		returnAll: boolean,
		limit: number,
		itemIndex: number,
	): Promise<{ _embedded?: { 'repeating-events'?: RepeatingEventResponse[] } }> {
		const qs: IDataObject = {
			'filter[app_key]': appKey,
		};

		if (!returnAll) {
			qs['page[size]'] = limit;
			qs['page[number]'] = 0;
		} else {
			qs['page[size]'] = 100;
		}

		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/events/v2/repeating-events`,
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
			return response as { _embedded?: { 'repeating-events'?: RepeatingEventResponse[] } };
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to list repeating events: ${errorMessage}`,
			});
		}
	}

	private async getRepeatingEvent(
		context: IExecuteFunctions,
		baseUrl: string,
		repeatingEventId: string,
		itemIndex: number,
	): Promise<RepeatingEventResponse> {
		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${baseUrl}/events/v2/repeating-events/${repeatingEventId}`,
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
			return response as RepeatingEventResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to get repeating event: ${errorMessage}`,
			});
		}
	}

	private async buildRepeatingEventBody(
		context: IExecuteFunctions,
		appKey: string,
		itemIndex: number,
	): Promise<IDataObject> {
		const requestBody: IDataObject = {
			app_key: appKey,
		};

		const title = context.getNodeParameter('title', itemIndex, '') as string;
		if (title) {
			requestBody.title = title;
		}

		const description = context.getNodeParameter('description', itemIndex, '') as string;
		if (description) {
			requestBody.description = description;
		}

		const subtitle = context.getNodeParameter('subtitle', itemIndex, '') as string;
		if (subtitle) {
			requestBody.subtitle = subtitle;
		}

		const status = context.getNodeParameter('status', itemIndex, '') as string;
		if (status) {
			requestBody.status = status;
		}

		return requestBody;
	}

	private async createRepeatingEvent(
		context: IExecuteFunctions,
		baseUrl: string,
		requestBody: IDataObject,
		itemIndex: number,
	): Promise<RepeatingEventResponse> {
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${baseUrl}/events/v2/repeating-events`,
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
			return response as RepeatingEventResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to create repeating event: ${errorMessage}`,
			});
		}
	}

	private async updateRepeatingEvent(
		context: IExecuteFunctions,
		baseUrl: string,
		repeatingEventId: string,
		requestBody: IDataObject,
		itemIndex: number,
	): Promise<RepeatingEventResponse> {
		const options: IHttpRequestOptions = {
			method: 'PATCH',
			url: `${baseUrl}/events/v2/repeating-events/${repeatingEventId}`,
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
			return response as RepeatingEventResponse;
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to update repeating event: ${errorMessage}`,
			});
		}
	}

	private async deleteRepeatingEvent(
		context: IExecuteFunctions,
		baseUrl: string,
		repeatingEventId: string,
		itemIndex: number,
	): Promise<void> {
		const options: IHttpRequestOptions = {
			method: 'DELETE',
			url: `${baseUrl}/events/v2/repeating-events/${repeatingEventId}`,
			headers: {
				Accept: 'application/vnd.api+json',
			},
			json: true,
		};

		try {
			await context.helpers.httpRequestWithAuthentication.call(context, 'subsplashApi', options);
		} catch (error) {
			const errorMessage = this.extractErrorMessage(context, error);
			throw new NodeOperationError(context.getNode(), error, {
				itemIndex,
				description: `Failed to delete repeating event: ${errorMessage}`,
			});
		}
	}

	private extractErrorMessage(context: IExecuteFunctions, error: unknown): string {
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

