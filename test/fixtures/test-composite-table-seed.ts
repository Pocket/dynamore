import { BatchWriteCommandInput } from '@aws-sdk/lib-dynamodb';

export const seedData: BatchWriteCommandInput = {
  RequestItems: {
    'test-composite-table': [
      {
        PutRequest: {
          Item: {
            name: 'goku',
            powerLevel: 10,
            series: 'dragonball',
            saga: 'Emperor Pilaf',
            source: 'Daizenshuu 7',
            form: 'human',
          },
        },
      },
      {
        PutRequest: {
          Item: {
            name: 'goku',
            powerLevel: 100,
            series: 'dragonball',
            saga: 'Emperor Pilaf',
            source: 'Daizenshuu 7',
            form: 'great ape',
          },
        },
      },
      {
        PutRequest: {
          Item: {
            name: 'shu',
            powerLevel: 40,
            series: 'dragonball',
            saga: 'Emperor Pilaf',
            source: 'Movie 6 Pamphlet',
          },
        },
      },
      {
        PutRequest: {
          Item: {
            name: 'goku',
            powerLevel: 9001,
            series: 'dragonball z',
            saga: 'Vegeta',
            source: 'Vol. 19, #224 (Ocean Dub)',
          },
        },
      },
      {
        PutRequest: {
          Item: {
            name: 'piccolo',
            powerLevel: 3500,
            series: 'dragonball z',
            saga: 'Vegeta',
            source: 'Daizenshuu 7',
          },
        },
      },
      {
        PutRequest: {
          Item: {
            name: 'vegeta',
            powerLevel: 18000,
            series: 'dragonball z',
            saga: 'Vegeta',
            source: 'Vol. 21, #249',
          },
        },
      },
      {
        PutRequest: {
          Item: {
            name: 'captain-ginyu',
            powerLevel: 18000,
            series: 'dragonball z',
            saga: 'Captain Ginyu',
            source: 'Vol. 24, #285',
          },
        },
      },
      {
        PutRequest: {
          Item: {
            name: 'goku',
            powerLevel: 150000000,
            series: 'dragonball z',
            saga: 'Frieza',
            source: 'Daizenshuu 7',
            form: 'super saiyan',
          },
        },
      },
    ],
  },
};
