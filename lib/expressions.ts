class ExpressionAttributeFactoryBase<TAttribute> {
  _prefix: string;
  // Map of aliases to original attribute
  _aliasMap: Record<string, TAttribute>;
  // Map of original attribute to alias, for lookup
  _inputMap: Record<string, string>;
  _aliasCount: number;
  _hashFn?: (key: any) => string;

  constructor() {
    this._aliasMap = {};
    this._inputMap = {};
    this._aliasCount = 0;
  }

  get expression() {
    return this._aliasMap;
  }

  createAlias(attribute: string) {
    throw Error('Not Implemented');
  }

  /**
   * Create an alias for an attribute
   * @param attribute
   */
  addAliasFor(attribute: string) {
    this.createAlias(attribute);
    return this;
  }
  /**
   * Return the expression attribute name/value from the original key
   */
  getAliasFor(attribute: any): any {
    return this._inputMap[attribute];
  }
  /**
   * Return the original key mapped to the expression attribute name/value
   */
  getAttributeFrom(alias: string): TAttribute {
    return this._aliasMap[alias];
  }
}

interface HasExpressionAttributeNames {
  ExpressionAttributeNames: {
    [key: string]: string;
  };
}

interface HasExpressionAttributeValues {
  ExpressionAttributeValues: {
    [key: string]: any;
  };
}

export class ExpressionAttributeNamesFactory extends ExpressionAttributeFactoryBase<string> {
  constructor(...attributeNames: string[]) {
    super();
    this._prefix = '#n';
    const uniqueAttributes = new Set(attributeNames);
    uniqueAttributes.forEach((attr) => {
      this.createAlias(attr);
    });
  }

  public static fromCommand<C extends HasExpressionAttributeNames>(
    command: C
  ): ExpressionAttributeNamesFactory {
    const factory = new ExpressionAttributeNamesFactory();
    factory._aliasMap = command.ExpressionAttributeNames;
    factory._aliasCount =
      Object.keys(command.ExpressionAttributeNames).length - 1;
    // Reversing the lookup map
    factory._inputMap = Object.entries(factory._aliasMap).reduce(
      (_inputMap, [alias, attribute]) => {
        _inputMap[attribute] = alias;
        return _inputMap;
      },
      {} as Record<string, string>
    );
    return factory;
  }

  createAlias(attribute: string) {
    const alias = this._prefix + this._aliasCount;
    this._aliasCount += 1;
    this._aliasMap[alias] = attribute;
    this._inputMap[attribute] = alias;
  }
}

export class ExpressionAttributeValuesFactory extends ExpressionAttributeFactoryBase<any> {
  constructor(...attributeValues: any[]) {
    super();
    this._prefix = ':v';
    this._aliasCount = 0;
    attributeValues.forEach((attr) => {
      this.createAlias(attr);
    });
  }

  public static fromCommand<C extends HasExpressionAttributeValues>(
    command: C
  ): ExpressionAttributeValuesFactory {
    const factory = new ExpressionAttributeValuesFactory();
    factory._aliasMap = command.ExpressionAttributeValues;
    factory._aliasCount =
      Object.keys(command.ExpressionAttributeValues).length - 1;
    // Reversing the lookup map
    factory._inputMap = Object.entries(factory._aliasMap).reduce(
      (_inputMap, [alias, attribute]) => {
        _inputMap[attribute] = alias;
        return _inputMap;
      },
      {} as Record<string, string>
    );
    return factory;
  }

  createAlias(attribute: any) {
    // TODO: does using an arbitrary value as a key work?
    // e.g. an array
    // or do we need to stringify it/hash it
    // Added hashFn in the super class; have to decide how to use it
    const alias = this._prefix + this._aliasCount;
    this._aliasCount += 1;
    this._aliasMap[alias] = attribute;
    this._inputMap[attribute] = alias; // TODO: hashFn
  }

  getAliasFor(attribute: any) {
    const key = this._hashFn ? this._hashFn(attribute) : attribute;
    return super.getAliasFor(key);
  }
}
