import { BatchWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import { chunk } from 'lodash';

const pigeonText = 'mine'.repeat(100000);
const putRequests = [...Array(120).keys()].map((_id) => {
  return {
    PutRequest: {
      Item: {
        id: _id.toString(),
        text: pigeonText,
      },
    },
  };
});
const chunked = chunk(putRequests, 10);
export const seedData: BatchWriteCommandInput[] = chunked.map((req) => ({
  RequestItems: { 'test-big-table': req },
}));
