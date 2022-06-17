import { DynamoDBDocumentClient, GetCommandInput } from '@aws-sdk/lib-dynamodb';
import { DynamoreGet, DynamoreGetMany } from './get';

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
}
