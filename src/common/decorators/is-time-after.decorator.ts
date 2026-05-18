import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/** Valida que la propiedad (hora HH:mm) sea lexicográficamente posterior a `property`. */
export function IsTimeAfter(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTimeAfter',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            relatedValue === undefined ||
            relatedValue === null ||
            relatedValue === ''
          ) {
            return true;
          }
          if (typeof value !== 'string' || typeof relatedValue !== 'string') {
            return false;
          }
          return value > relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          return `${args.property} debe ser posterior a ${relatedPropertyName}`;
        },
      },
    });
  };
}
