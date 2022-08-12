import { DynamoreBuilder } from './dynamore';
import {
  BatchGetCommandInput,
  BatchGetCommand,
  BatchGetCommandOutput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { buildExpression } from './projectionExpression';
import { backoff } from './utils';
import { GetManyOutput, BatchGetItemKeys } from './types';

export class DynamoreGetMany // eslint-disable-next-line prettier/prettier
implements
    DynamoreBuilder<BatchGetCommandInput, BatchGetCommand, GetManyOutput>
{
  private _command: BatchGetCommandInput;
  private maxBackoff: number;
  /**
   * Builder for retrieving a multiple items from a table, by key.
   * This class should not be constructed directly, but is created
   * from the DynamoreBuilder.
   * @param client client for sending requests to DynamoDB
   * @param table name of table to get from
   * @param itemKeys get items by these keys
   * @param options additional options for the Dynamodb commands
   */
  constructor(
    private client: DynamoDBDocumentClient,
    private table: string,
    itemKeys: BatchGetItemKeys,
    options?: Pick<
      GetCommandInput,
      'ConsistentRead' | 'ReturnConsumedCapacity'
    >,
    fetchOptions?: { maxBackoff: number }
  ) {
    const { ConsistentRead, ReturnConsumedCapacity } = options ?? {};
    this._command = {
      RequestItems: {
        [table]: {
          Keys: itemKeys,
          ConsistentRead: ConsistentRead,
        },
      },
      ReturnConsumedCapacity,
    };
    this.maxBackoff = fetchOptions?.maxBackoff ?? 500;
  }
  /**
   * Select a subset of attributes. Since all attributes are internally
   * mapped with projection expression, do not worry about names that
   * conflict with DynamoDB protected strings.
   * @param attributes list of attributes to retrieve. If empty, will
   * retrieve all available attributes on the key.
   */
  public select(...attributes: string[]) {
    if (attributes.length > 0) {
      const { ExpressionAttributeNames, ProjectionExpression } =
        buildExpression(...attributes);
      this._command['RequestItems'][this.table]['ExpressionAttributeNames'] =
        ExpressionAttributeNames;
      this._command['RequestItems'][this.table]['ProjectionExpression'] =
        ProjectionExpression;
    }
    return this;
  }
  /**
   * Return the underlying command sent to DynamoDB.
   * Can be useful for debugging.
   */
  public get command(): BatchGetCommand {
    return new BatchGetCommand(this._command);
  }
  /**
   * Return the underlying command input sent to DynamoDB.
   * Can be useful for debugging.
   */
  public get commandInput(): BatchGetCommandInput {
    return this._command;
  }
  /**
   * Execute the command.
   */
  async send(): Promise<GetManyOutput> {
    const res: GetManyOutput = { Items: [], $metadata: [] };
    const iter = this.yield();
    let batch = await iter.next();
    const items = batch.value?.Responses[this.table];
    if (items) {
      res.Items.push(...items);
      res.$metadata.push(batch.value?.$metadata);
    }
    while (!batch.done) {
      batch = await iter.next();
      const items = batch.value?.Responses[this.table];
      if (items) {
        res.Items.push(...items);
        res.$metadata.push(batch.value?.$metadata);
      }
    }
    return res as any;
  }

  private async *yield() {
    // TODO: Error handling
    let unprocessedKeys = this._command['RequestItems'];
    let pages = 0;
    let response: BatchGetCommandOutput;
    while (unprocessedKeys) {
      const batchItemCommand = new BatchGetCommand({
        RequestItems: unprocessedKeys,
      });
      if (pages > 0) {
        await backoff(pages, this.maxBackoff);
      }
      response = await this.client.send(batchItemCommand);
      pages += 1;
      if (
        response.UnprocessedKeys &&
        Object.keys(response.UnprocessedKeys).length > 0
      ) {
        unprocessedKeys = response.UnprocessedKeys;
      } else {
        unprocessedKeys = undefined;
        return response;
      }
      yield response;
    }
  }
}

export class DynamoreGet // eslint-disable-next-line prettier/prettier
implements DynamoreBuilder<GetCommandInput, GetCommand, GetCommandOutput>
{
  private _command: GetCommandInput;
  /**
   * Builder for retrieving a single item from a table, by key.
   * This class should not be constructed directly, but is created
   * from the DynamoreBuilder.
   * @param client client for sending requests to DynamoDB
   * @param table name of table to get from
   * @param key get an item by this key
   * @param options additional options for the Dynamodb commands
   */
  constructor(
    private client: DynamoDBDocumentClient,
    table: string,
    key: GetCommandInput['Key'],
    options?: Pick<GetCommandInput, 'ConsistentRead' | 'ReturnConsumedCapacity'>
  ) {
    const queryOptions = options ?? {};
    this._command = {
      TableName: table,
      Key: key,
      ...queryOptions,
    };
  }

  /**
   * Select a subset of attributes. Since all attributes are internally
   * mapped with projection expression, do not worry about names that
   * conflict with DynamoDB protected strings.
   * @param attributes list of attributes to retrieve. If empty, will
   * retrieve all available attributes on the key.
   */
  public select(...attributes: string[]) {
    if (attributes.length > 0) {
      const { ExpressionAttributeNames, ProjectionExpression } =
        buildExpression(...attributes);
      this._command['ExpressionAttributeNames'] = ExpressionAttributeNames;
      this._command['ProjectionExpression'] = ProjectionExpression;
    }
    return this;
  }

  /**
   * Return the underlying command sent to DynamoDB.
   * Can be useful for debugging.
   */
  public get command(): GetCommand {
    return new GetCommand(this._command);
  }

  /**
   * Return the underlying command input sent to DynamoDB.
   * Can be useful for debugging.
   */
  public get commandInput(): GetCommandInput {
    return this._command;
  }

  /**
   * Execute the command.
   */
  public send(): Promise<GetCommandOutput> {
    return this.client.send(new GetCommand(this._command));
  }
}
