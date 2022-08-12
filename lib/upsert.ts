import { DynamoreBuilder } from './dynamore';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { ExpressionAttributeNamesFactory } from './expressions';

export class DynamorePut // eslint-disable-next-line prettier/prettier
implements DynamoreBuilder<PutCommandInput, PutCommand, PutCommandOutput>
{
  private _command: PutCommandInput;
  readonly names: ExpressionAttributeNamesFactory;

  /**
   * Builder for inserting or replacing a record in a DynamoDB table.
   * This class should not be constructed directly, but is created
   * from the DynamoreBuilder.
   * @param client client for sending requests to DynamoDB
   * @param table name of table to insert into
   * @param item the item to insert into the table. Must include all
   * all key attributes and values
   * @param options additional options for the Dynamodb commands
   */
  constructor(
    readonly client: DynamoDBDocumentClient,
    table: string,
    readonly key: Record<string, any>,
    item: PutCommandInput['Item'],
    options?: Pick<
      PutCommandInput,
      'ReturnItemCollectionMetrics' | 'ReturnConsumedCapacity'
    >
  ) {
    // Add key to Item just in case user didn't duplicate it
    const itemWithKey = { ...item, ...key };
    const queryOptions = options ?? {};

    this.names = new ExpressionAttributeNamesFactory(
      ...Object.keys(itemWithKey)
    );

    // Initial command context
    this._command = {
      TableName: table,
      Item: itemWithKey,
      ...queryOptions,
    };
  }

  public onConflict(action: 'REPLACE' | 'UPDATE' | 'DO NOTHING') {
    switch (action) {
      // This is default behavior for DynamoDB
      case 'REPLACE': {
        break;
      }
      /**
       * Unintuitively, using `attribute_not_exists` on any attribute that
       * exists in the table (e.g. a hash or range key), checks whether
       * there is already a record indexed by the key(s).
       */
      case 'DO NOTHING': {
        const keyName = Object.keys(this.key)[0];
        const alias = this.names.getAliasFor(keyName);
        // TODO: Is there a better way to manage expression context?
        // Need context for condition expression as well as update expression
        // for both values and names
        const conditionStatement = `attribute_not_exists(${alias})`;
        this._command.ExpressionAttributeNames = {
          ...(this._command.ExpressionAttributeNames || {}),
          [alias]: keyName,
        };
        this.andCondition(conditionStatement);
        break;
      }
      case 'UPDATE': {
        // TODO:
        // return DynamoreUpdate.fromPut(this);
        break;
      }
    }
    return this;
  }

  private andCondition(conditionStatement: string) {
    if (this._command.ConditionExpression != null) {
      this._command.ConditionExpression += `and ${conditionStatement}`;
    } else {
      this._command.ConditionExpression = conditionStatement;
    }
  }

  /**
   * Return the underlying command sent to DynamoDB.
   * Can be useful for debugging.
   */
  public get command(): PutCommand {
    return new PutCommand(this._command);
  }

  /**
   * Return the underlying command input sent to DynamoDB.
   * Can be useful for debugging.
   */
  public get commandInput(): PutCommandInput {
    return this._command;
  }

  /**
   * Execute the command.
   */
  public send(): Promise<PutCommandOutput> {
    return this.client.send(new PutCommand(this._command));
  }
}
