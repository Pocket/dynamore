import { GetCommandInput } from '@aws-sdk/lib-dynamodb';

/**
 * No dots allowed in attribute names (must be accessing nested attributes)
 * TODO: Handle nested attributes and array accessors
 * @param attributes
 */
export function buildExpression(
  ...attributes: string[]
): Pick<GetCommandInput, 'ProjectionExpression' | 'ExpressionAttributeNames'> {
  // Alias every field in projectionExpression just in case
  // there is a collision in reserved keywords or weird special chars
  const usedNames = {};
  const expressions = attributes.reduce(
    (expression, attribute) => {
      let projection = '#' + attribute[0];
      if (usedNames[projection] != null) {
        usedNames[projection] += 1;
        projection += usedNames[projection];
      } else {
        usedNames[projection] = 0;
      }
      if (expression.ProjectionExpression.length) {
        expression.ProjectionExpression += `, ${projection}`;
      } else {
        expression.ProjectionExpression = projection;
      }
      expression.ExpressionAttributeNames[projection] = attribute;
      return expression;
    },
    {
      ProjectionExpression: '',
      ExpressionAttributeNames: {},
    }
  );
  return expressions;
}
