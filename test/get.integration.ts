import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config } from './config';
import { dynamore } from '../lib/dynamore';
import { seed, truncateTable } from './utils';
import { seedData as hashSeed } from './fixtures/test-hash-table-seed';
import { seedData as compositeSeed } from './fixtures/test-composite-table-seed';

describe('DynamoreGet', () => {
  const client = new DynamoDBClient({
    region: config.aws.region,
    endpoint: config.aws.endpoint,
  });
  const dynamodb = DynamoDBDocumentClient.from(client);
  const hashTable = dynamore(dynamodb)('test-hash-table');
  const compTable = dynamore(dynamodb)('test-composite-table');

  beforeAll(async () => {
    await truncateTable('test-hash-table', client);
    await seed(client, hashSeed);
    await truncateTable('test-composite-table', client);
    await seed(client, compositeSeed);
  });
  describe('find', () => {
    it('gets all available attributes for a key', async () => {
      const res = await hashTable.find({ id: 'abc123' }).send();
      expect(res.Item).toEqual({
        id: 'abc123',
        name: 'dracula',
        aka: 'Vlad Ţepeş',
        species: 'vampire',
      });
    });
    it('gets all available attributes for a composite key', async () => {
      const res = await compTable.find({ name: 'goku', powerLevel: 10 }).send();
      expect(res.Item).toEqual({
        name: 'goku',
        powerLevel: 10,
        series: 'dragonball',
        saga: 'Emperor Pilaf',
        source: 'Daizenshuu 7',
        form: 'human',
      });
    });
    it('returns undefined Item if hash key does not exist', async () => {
      const res = await hashTable.find({ id: 'notreal' }).send();
      expect(res.Item).toBeUndefined;
    });
    it('returns undefined Item if composite key does not exist', async () => {
      const res = await compTable.find({ name: 'goku', powerLevel: 0 }).send();
      expect(res.Item).toBeUndefined;
    });
    it('selects a specific attribute', async () => {
      const res = await hashTable
        .find({ id: 'hij789' })
        .select('species')
        .send();
      expect(res.Item).toEqual({ species: 'human' });
    });
    it('selects multiple attributes', async () => {
      const res = await hashTable
        .find({ id: 'def456' })
        .select('species', 'name')
        .send();
      expect(res.Item).toEqual({ species: 'dhampir', name: 'alucard' });
    });
    it('returns undefined for nonexistent attributes', async () => {
      const res = await hashTable
        .find({ id: 'def456' })
        .select('species', 'name', 'favoriteFood')
        .send();
      expect(res.Item).toEqual({
        species: 'dhampir',
        name: 'alucard',
        favoriteFood: undefined,
      });
    });
  });
  describe('findMany', () => {
    it('returns multiple hash keys and all their attributes', async () => {
      const res = await hashTable
        .findMany([{ id: 'hij789' }, { id: 'klm123' }])
        .send();
      expect(res.Items.length).toEqual(2);
      expect(res.Items).toContainEqual({
        id: 'hij789',
        name: 'sypha',
        species: 'human',
      });
      expect(res.Items).toContainEqual({
        id: 'klm123',
        name: 'trevor',
        species: 'human',
      });
    });
    it('returns multiple composite keys and all their attributes', async () => {
      const res = await compTable
        .findMany([
          { name: 'goku', powerLevel: 100 },
          { name: 'vegeta', powerLevel: 18000 },
        ])
        .send();
      expect(res.Items.length).toEqual(2);
      expect(res.Items).toContainEqual({
        name: 'goku',
        powerLevel: 100,
        series: 'dragonball',
        saga: 'Emperor Pilaf',
        source: 'Daizenshuu 7',
        form: 'great ape',
      });
      expect(res.Items).toContainEqual({
        name: 'vegeta',
        powerLevel: 18000,
        series: 'dragonball z',
        saga: 'Vegeta',
        source: 'Vol. 21, #249',
      });
    });
    it('returns multiple keys with selected attributes', async () => {
      const res = await hashTable
        .findMany([{ id: 'def456' }, { id: 'klm123' }])
        .select('name', 'species')
        .send();
      expect(res.Items.length).toEqual(2);
      expect(res.Items).toContainEqual({
        name: 'alucard',
        species: 'dhampir',
      });
      expect(res.Items).toContainEqual({
        name: 'trevor',
        species: 'human',
      });
    });
    it('returns multiple keys with non-overlapping attributes', async () => {
      const res = await hashTable
        .findMany([{ id: 'def456' }, { id: 'klm123' }])
        .select('name', 'species', 'aka')
        .send();
      expect(res.Items.length).toEqual(2);
      expect(res.Items).toContainEqual({
        name: 'alucard',
        species: 'dhampir',
        aka: 'Adrian Ţepeş',
      });
      expect(res.Items).toContainEqual({
        name: 'trevor',
        species: 'human',
        aka: undefined,
      });
    });
  });
});
