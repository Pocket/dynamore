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
import { buildExpression } from './expressions';
import { backoff } from './utils';
import { GetManyOutput, BatchGetItemKeys } from './types';

export class DynamoreGetMany
implements
    DynamoreBuilder<BatchGetCommandInput, BatchGetCommand, GetManyOutput>
{
  private _command: BatchGetCommandInput;
  private maxBackoff: number;

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
    // TODO: Split out requests > 100
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
  public get command(): BatchGetCommand {
    return new BatchGetCommand(this._command);
  }

  public get commandInput(): BatchGetCommandInput {
    return this._command;
  }

  async send(): Promise<GetManyOutput> {
    const res: GetManyOutput = { Items: [], $metadata: [] };
    let batch = await this.yield().next();
    const items = batch.value?.Responses[this.table];
    if (items) {
      res.Items.push(...items);
      res.$metadata.push(batch.value?.$metadata);
    }
    while (!batch.done) {
      batch = await this.yield().next();
      const items = batch.value?.Responses[this.table];
      if (items) res.Items.push(...items);
    }
    return res as any;
  }

  async *yield() {
    // TODO: Split out requests > 100
    // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
    // TODO: Error handling?
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

export class DynamoreGet
implements DynamoreBuilder<GetCommandInput, GetCommand, GetCommandOutput>
{
  private _command: GetCommandInput;
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

  public select(...attributes: string[]) {
    if (attributes.length > 0) {
      const { ExpressionAttributeNames, ProjectionExpression } =
        buildExpression(...attributes);
      this._command['ExpressionAttributeNames'] = ExpressionAttributeNames;
      this._command['ProjectionExpression'] = ProjectionExpression;
    }
    return this;
  }

  public get command(): GetCommand {
    return new GetCommand(this._command);
  }

  public get commandInput(): GetCommandInput {
    return this._command;
  }

  public send(): Promise<GetCommandOutput> {
    return this.client.send(new GetCommand(this._command));
  }
}
