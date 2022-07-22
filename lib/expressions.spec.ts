import { buildExpression } from './expressions';

describe('projection expression builder', () => {
  it('maps a single value to expression', () => {
    const expected = {
      ProjectionExpression: '#a',
      ExpressionAttributeNames: {
        '#a': 'alucard',
      },
    };
    const actual = buildExpression('alucard');
    expect(actual).toEqual(expected);
  });
  it('maps multiple values to expressions without collisions', () => {
    const expected = {
      ProjectionExpression: '#a, #d',
      ExpressionAttributeNames: {
        '#a': 'alucard',
        '#d': 'dracula',
      },
    };
    const actual = buildExpression('alucard', 'dracula');
    expect(actual).toEqual(expected);
  });
  it('handles collisions in attribute names', () => {
    const expected = {
      ProjectionExpression: '#f, #f1, #f2',
      ExpressionAttributeNames: {
        '#f': 'fang',
        '#f1': 'fist',
        '#f2': 'fire',
      },
    };
    const actual = buildExpression('fang', 'fist', 'fire');
    expect(actual).toEqual(expected);
  });
  // TODO
  it.skip('handles nested attribute and array accessors with collisions and repeats', () => {
    const expected = {
      ProjectionExpression: '#f.#f1, #a, #h[0].#b.#c.#f1',
      ExpressionAttributeNames: {
        '#f': 'face',
        '#f1': 'fang',
        '#a': 'armpit',
        '#h': 'hand',
        '#b': 'bow',
        '#c': 'cross',
      },
    };
    const actual = buildExpression(
      'fang.fist',
      'armpit',
      'hand[0].bow.cross.fang'
    );
    expect(actual).toEqual(expected);
  });
});
