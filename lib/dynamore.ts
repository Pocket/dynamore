import {
  DynamoDBDocumentClient,
  GetCommandInput,
  PutCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { DynamoreGet, DynamoreGetMany } from './get';
import { DynamorePut } from './upsert';

/**
 * Entrypoint for creating a dynamore connection. The dynamore
 * builder is table-specific.
 * @example
 * const conn = dynamore(client);
 * // Make a request to fetch a key from a table,
 * // with a subset of attributes
 * const res = await conn('My-Table')
 *   .find({ id: 1 })
 *   .select('id', 'name', 'superpower')
 *   .send()
 * @param client a DynamoDBDocument client instance; all commands
 * will be sent using this client.
 */
export function dynamore(
  client: DynamoDBDocumentClient
): (table: string) => Dynamore {
  const dynamoreClient = (table: string) => {
    return new Dynamore(client, table);
  };
  return dynamoreClient;
}

export interface DynamoreBuilder<I, C, O> {
  command: C;
  commandInput: I;
  send: () => Promise<O>;
}

class Dynamore {
  constructor(private client: DynamoDBDocumentClient, private table: string) {}
  public find(
    key: GetCommandInput['Key'],
    options?: Pick<GetCommandInput, 'ConsistentRead' | 'ReturnConsumedCapacity'>
  ): DynamoreGet {
    return new DynamoreGet(this.client, this.table, key, options);
  }
  public findMany(
    keys: GetCommandInput['Key'][],
    options?: Pick<GetCommandInput, 'ConsistentRead' | 'ReturnConsumedCapacity'>
  ): DynamoreGetMany {
    return new DynamoreGetMany(this.client, this.table, keys, options);
  }
  /**
   *
   * @param key
   * @param item
   * @param options
   * @returns
   */
  public insert(
    key: Record<string, any>,
    item: PutCommandInput['Item'],
    options?: Pick<
      PutCommandInput,
      'ReturnItemCollectionMetrics' | 'ReturnConsumedCapacity'
    >
  ) {
    return new DynamorePut(this.client, this.table, key, item, options);
  }
}
