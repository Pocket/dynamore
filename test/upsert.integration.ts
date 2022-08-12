import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config } from './config';
import { dynamore } from '../lib/dynamore';
import { seed, truncateTable } from './utils';
import { seedData as hashSeed } from './fixtures/test-hash-table-seed';
import { seedData as compositeSeed } from './fixtures/test-composite-table-seed';
import sinon from 'sinon';

describe('DynamorePut', () => {
  const client = new DynamoDBClient({
    region: config.aws.region,
    endpoint: config.aws.endpoint,
  });
  const dynamodb = DynamoDBDocumentClient.from(client);
  const hashTable = dynamore(dynamodb)('test-hash-table');
  const compTable = dynamore(dynamodb)('test-composite-table');

  beforeEach(async () => {
    await truncateTable('test-hash-table', client);
    await seed(client, hashSeed);
    await truncateTable('test-composite-table', client);
    await seed(client, compositeSeed);
  });
  afterEach(() => sinon.resetHistory());
  afterAll(() => sinon.restore());
  describe('insert operations', () => {
    it('adds a new item to a table', async () => {
      const character = {
        id: '123cba',
        name: `Drizzt Do'Urden`,
        species: 'drow',
      };
      await hashTable.insert({ id: '123cba' }, character).send();
      const { Item } = await hashTable.find({ id: '123cba' }).send();
      expect(Item).toEqual(character);
    });
    describe('when key already exists', () => {
      const oldDracula = {
        id: 'abc123',
        name: 'dracula',
        aka: 'Vlad Ţepeş',
        species: 'vampire',
      };
      const newDracula = {
        id: 'abc123',
        name: 'Vlad III',
        aka: 'Vlad the Impaler',
        home: 'Wallachia',
      };
      const query = hashTable.find({ id: 'abc123' });

      it('replaces an existing item in a table', async () => {
        // Some redundancy to ensure table is set up properly
        const oldRes = await query.send();
        expect(oldRes.Item).toEqual(oldDracula);

        await hashTable.insert({ id: 'abc123' }, newDracula).send();
        const newRes = await query.send();
        expect(newRes.Item).toEqual(newDracula);
      });
      it('does not insert if item already exists and ON CONFLICT=DO NOTHING', async () => {
        const oldRes = await query.send();
        expect(oldRes.Item).toEqual(oldDracula);
        try {
          await hashTable
            .insert({ id: 'abc123' }, newDracula)
            .onConflict('DO NOTHING')
            .send();
        } catch (e) {
          // TODO: Should this throw an error or no?
          // ConditionalCheckFailedException
          console.log(e);
        }
        const newRes = await query.send();
        expect(newRes.Item).toEqual(oldRes.Item);
      });
      it.skip('merges changes if ON CONFLICT=UPDATE', async () => {
        const oldRes = await query.send();
        expect(oldRes.Item).toEqual(oldDracula);
        await hashTable
          .insert({ id: 'abc123' }, newDracula)
          .onConflict('UPDATE')
          .send();
        const newRes = await query.send();
        expect(newRes.Item).toEqual({
          ...newDracula,
          species: 'vampire',
        });
      });
    });
  });
  describe('update operations', () => {
    // const oldDracula = {
    //   id: 'abc123',
    //   name: 'dracula',
    //   aka: 'Vlad Ţepeş',
    //   species: 'vampire',
    // };
    // it('creates a new item if it does not exist', async () => {
    //   const character = {
    //     id: '123cba',
    //     name: `Drizzt Do'Urden`,
    //     species: 'drow',
    //   };
    //   const res = await hashTable.update(character).send();
    //   const { Item } = await hashTable.find({ id: 'abc123' }).send();
    //   expect(Item).toEqual(character);
    // });
    // it('updates attributes, adding new and overwriting existing', async () => {
    //   const query = hashTable.find({ id: 'abc123' });
    //   const oldRes = await query.send();
    //   expect(oldRes.Item).toEqual(oldDracula);
    //   const updatedAttributes = {
    //     id: 'abc123',
    //     aka: 'Vlad the Impaler',
    //     home: 'Wallachia',
    //   };
    //   await hashTable.update(updatedAttributes).send();
    //   const res = await query.send();
    //   expect(res.Item).toEqual({ ...oldDracula, ...updatedAttributes });
    // });
    it.todo('increments numeric attributes');
    it.todo('decrements numeric attributes');
    it.todo('appends elements to end of list');
    it.todo('prepends elements to end of a list');
    it.todo('deletes element from a list');
    it.todo('removes attributes');
    it.todo('can choose to update attribute only if does not exist');
  });
  describe('return values', () => {
    describe('all old', () => {
      it.todo('returns previous values before update');
      it.todo('returns updated attributes before the update');
    });
    describe('all new', () => {
      it.todo('returns entire item as it exists after operation');
      it.todo('returns only updated attributes as they exist after operation');
    });
  });
});
