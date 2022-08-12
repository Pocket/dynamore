import {
  ExpressionAttributeNamesFactory,
  ExpressionAttributeValuesFactory,
} from './expressions';

describe('expression attribute', () => {
  describe('names', () => {
    it('works for a single name', () => {
      const expGen = new ExpressionAttributeNamesFactory('str');
      const expected = {
        '#n0': 'str',
      };
      expect(expGen.expression).toEqual(expected);
    });
    it('works for multiple names', () => {
      const expGen = new ExpressionAttributeNamesFactory(
        'str',
        'dex',
        'con',
        'int',
        'wis',
        'cha'
      );
      const expected = {
        '#n0': 'str',
        '#n1': 'dex',
        '#n2': 'con',
        '#n3': 'int',
        '#n4': 'wis',
        '#n5': 'cha',
      };
      expect(expGen.expression).toEqual(expected);
    });
    it('createAlias adds a new alias', () => {
      const expGen = new ExpressionAttributeNamesFactory('insight');
      const expected = {
        '#n0': 'insight',
        '#n1': 'intimidation',
        '#n2': 'history',
      };
      expGen.addAliasFor('intimidation');
      expGen.addAliasFor('history');
      expect(expGen.expression).toEqual(expected);
    });
    it('has reverse lookup from alias to attribute name', () => {
      const expGen = new ExpressionAttributeNamesFactory(
        'str',
        'dex',
        'con',
        'int',
        'wis',
        'cha'
      );
      expect(expGen.getAttributeFrom('#n2')).toEqual('con');
      expect(expGen.getAttributeFrom('#n4')).toEqual('wis');
    });
    it.todo('works for nested values');
  });
  describe('values', () => {
    it('works for arrays', async () => {
      const expGen = new ExpressionAttributeValuesFactory(
        ['str', 'dex', 'con'],
        [8, 16, 12]
      );
      const expected = {
        ':v0': ['str', 'dex', 'con'],
        ':v1': [8, 16, 12],
      };
      expect(expGen.expression).toEqual(expected);
    });
    it('works for scalars (strings and numbers)', () => {
      const expGen = new ExpressionAttributeValuesFactory('str', 8);
      const expected = {
        ':v0': 'str',
        ':v1': 8,
      };
      expect(expGen.expression).toEqual(expected);
    });
    it('works for objects', () => {
      const expGen = new ExpressionAttributeValuesFactory(
        {
          str: 8,
          dex: 16,
          con: 12,
        },
        {
          str: 16,
          dex: 12,
          con: 8,
        }
      );
      const expected = {
        ':v0': {
          str: 8,
          dex: 16,
          con: 12,
        },
        ':v1': {
          str: 16,
          dex: 12,
          con: 8,
        },
      };
      expect(expGen.expression).toEqual(expected);
    });
    it('works for only a single value', () => {
      const expGen = new ExpressionAttributeValuesFactory('str');
      const expected = {
        ':v0': 'str',
      };
      expect(expGen.expression).toEqual(expected);
    });
    it('works for adding values if initialized without any', () => {
      const expGen = new ExpressionAttributeValuesFactory();
      expGen.addAliasFor('str');
      const expected = {
        ':v0': 'str',
      };
      expect(expGen.expression).toEqual(expected);
    });
  });
});
