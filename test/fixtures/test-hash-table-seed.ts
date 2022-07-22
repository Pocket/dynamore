import { BatchWriteCommandInput } from '@aws-sdk/lib-dynamodb';

export const seedData: BatchWriteCommandInput = {
  RequestItems: {
    'test-hash-table': [
      {
        PutRequest: {
          Item: {
            id: 'abc123',
            name: 'dracula',
            aka: 'Vlad Ţepeş',
            species: 'vampire',
          },
        },
      },
      {
        PutRequest: {
          Item: {
            id: 'def456',

            name: 'alucard',
            aka: 'Adrian Ţepeş',
            species: 'dhampir',
          },
        },
      },
      {
        PutRequest: {
          Item: {
            id: 'hij789',
            species: 'human',
            name: 'sypha',
          },
        },
      },
      {
        PutRequest: {
          Item: {
            id: 'klm123',
            species: 'human',
            name: 'trevor',
          },
        },
      },
    ],
  },
};
