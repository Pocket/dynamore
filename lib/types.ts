import { GetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { ResponseMetadata } from '@aws-sdk/types';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

export type GetManyOutput = Omit<GetCommandOutput, 'Item' | '$metadata'> & {
  Items?: Pick<GetCommandOutput, 'Item'>[];
  $metadata: ResponseMetadata[];
};

export type BatchGetItemKeys =
  | {
      [key: string]: NativeAttributeValue;
    }[]
  | undefined;
