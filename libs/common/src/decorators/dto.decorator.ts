import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  IsObject,
  IsOptional,
  IsEnum,
  IsEmail,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateNested,
  IsUUID,
  IsUrl,
  IsNotEmpty,
  IsInt,
  IsPositive,
} from 'class-validator';

type ValidatorOptions = {
  type?: any;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  isArray?: boolean;
  enum?: any;
  example?: any;
  description?: string;
  format?: string;
  default?: any;
  [key: string]: any; // Allow additional properties for ApiPropertyOptions
};

function getTypeMetadata(propertyType: any): { type: any; format?: string } {
  switch (propertyType) {
    case String:
      return { type: 'string' };
    case Number:
      return { type: 'number', format: 'double' };
    case Boolean:
      return { type: 'boolean' };
    case Date:
      return { type: 'string', format: 'date-time' };
    case Array:
      return { type: 'array' };
    case Object:
      return { type: 'object' };
    default:
      // For custom classes or enums
      if (
        propertyType &&
        propertyType.constructor === Object &&
        'enum' in propertyType
      ) {
        return { type: 'enum' };
      }
      return { type: 'string' };
  }
}

export function ApiPropertyWithValidator(options: ValidatorOptions = {}) {
  const {
    required = true,
    minLength,
    maxLength,
    min,
    max,
    isArray = false,
    enum: enumObj,
    example,
    description,
    format,
    default: defaultValue,
    ...otherOptions
  } = options;

  const type = Reflect.getMetadata('design:type', Object, 'dummy') || String;
  const { type: typeName, format: typeFormat } = getTypeMetadata(type);

  const decorators = [];
  const apiPropertyOptions: ApiPropertyOptions = {
    ...otherOptions,
    required,
    type: typeName === 'enum' ? 'enum' : typeName,
    isArray,
    example,
    description,
    format: format || typeFormat,
    default: defaultValue,
  };

  if (typeName === 'enum' && enumObj) {
    apiPropertyOptions.enum = enumObj;
    decorators.push(IsEnum(enumObj));
  }

  // Add validators based on type
  if (typeName === 'string') {
    decorators.push(IsString());
    if (required) decorators.push(IsNotEmpty());
    if (minLength !== undefined) decorators.push(MinLength(minLength));
    if (maxLength !== undefined) decorators.push(MaxLength(maxLength));
  } else if (typeName === 'number') {
    decorators.push(IsNumber({}, { message: 'Must be a number' }));
    if (min !== undefined) decorators.push(Min(min));
    if (max !== undefined) decorators.push(Max(max));
  } else if (typeName === 'boolean') {
    decorators.push(IsBoolean());
  } else if (typeName === 'date-time') {
    decorators.push(IsDate());
    decorators.push(Type(() => Date));
  } else if (isArray) {
    decorators.push(IsArray());
    decorators.push(ValidateNested({ each: true }));
  } else if (typeName === 'object') {
    decorators.push(IsObject());
    decorators.push(ValidateNested());
  }

  // Add API property
  decorators.unshift(ApiProperty(apiPropertyOptions));

  return applyDecorators(...decorators);
}

// Helper decorators for common use cases
export function StringField(options: Omit<ValidatorOptions, 'type'> = {}) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      type: String,
    })(target, propertyKey);
  };
}

export function NumberField(options: Omit<ValidatorOptions, 'type'> = {}) {
  return (target: any, propertyKey: string) => {
    const {
      required = true,
      min,
      max,
      example,
      description,
      default: defaultValue,
      ...restOptions
    } = options;

    const decorators = [
      ApiProperty({
        ...restOptions,
        type: Number,
        required,
        example,
        description,
        default: defaultValue,
        minimum: min,
        maximum: max,
      }),
      Type(() => Number),
      IsNumber({}, { message: 'Must be a number' }),
    ];

    if (required) decorators.push(IsNotEmpty());
    if (min !== undefined) decorators.push(Min(min));
    if (max !== undefined) decorators.push(Max(max));

    applyDecorators(...decorators)(target, propertyKey);
  };
}

export function BooleanField(options: Omit<ValidatorOptions, 'type'> = {}) {
  return (target: any, propertyKey: string) => {
    const {
      required = true,
      example,
      description,
      default: defaultValue,
      ...restOptions
    } = options;
    const decorators = [
      ApiProperty({
        ...restOptions,
        type: Boolean,
        required,
        example,
        description,
        default: defaultValue,
      }),
      IsBoolean(),
      Type(() => Boolean),
    ];
    applyDecorators(...decorators)(target, propertyKey);
  };
}

export function DateField(options: Omit<ValidatorOptions, 'type'> = {}) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      type: Date,
    })(target, propertyKey);
    Type(() => Date)(target, propertyKey);
  };
}

export function EnumField(
  enumObj: any,
  options: Omit<ValidatorOptions, 'type' | 'enum'> = {},
) {
  return (target: any, propertyKey: string) => {
    const {
      required = true,
      description,
      example,
      default: defaultValue,
      ...restOptions
    } = options;
    const decorators = [
      ApiProperty({
        ...restOptions,
        enum: enumObj,
        description,
        example,
        default: defaultValue,
        required,
      }),
      IsEnum(enumObj),
    ];
    applyDecorators(...decorators)(target, propertyKey);
  };
}

export function EmailField(
  options: Omit<ValidatorOptions, 'type' | 'format'> = {},
) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      type: String,
      format: 'email',
    })(target, propertyKey);
    IsEmail()(target, propertyKey);
  };
}

export function UrlField(
  options: Omit<ValidatorOptions, 'type' | 'format'> = {},
) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      type: String,
      format: 'url',
    })(target, propertyKey);
    IsUrl()(target, propertyKey);
  };
}

export function UuidField(
  options: Omit<ValidatorOptions, 'type' | 'format'> = {},
) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      type: String,
      format: 'uuid',
    })(target, propertyKey);
    IsUUID()(target, propertyKey);
  };
}

export function ArrayField(
  options: Omit<ValidatorOptions, 'type' | 'isArray'> = {},
) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      type: Array,
      isArray: true,
    })(target, propertyKey);
    IsArray()(target, propertyKey);
  };
}

export function ObjectField(
  options: Omit<ValidatorOptions, 'type' | 'isArray'> = {},
) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      type: Object,
      isArray: false,
    })(target, propertyKey);
    IsObject()(target, propertyKey);
  };
}

export function NumberArrayField(
  options: Omit<ValidatorOptions, 'type' | 'isArray'> = {},
) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      type: Array,
      isArray: true,
    })(target, propertyKey);
    IsArray()(target, propertyKey);
  };
}

export function StringArrayField(
  options: Omit<ValidatorOptions, 'type' | 'isArray'> = {},
) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      type: Array,
      isArray: true,
    })(target, propertyKey);
    IsArray()(target, propertyKey);
  };
}

// Optional String
export function OptionalStringField(
  options: Omit<ValidatorOptions, 'type'> = {},
) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      type: String,
      required: false,
    })(target, propertyKey);
    IsOptional()(target, propertyKey);
    IsString()(target, propertyKey);
  };
}

// Optional Number
export function OptionalNumberField(
  options: Omit<ValidatorOptions, 'type'> = {},
) {
  return (target: any, propertyKey: string) => {
    const {
      min,
      max,
      example,
      description,
      default: defaultValue,
      ...restOptions
    } = options;

    const decorators = [
      ApiProperty({
        ...restOptions,
        type: Number,
        required: false,
        example,
        description,
        default: defaultValue,
        minimum: min,
        maximum: max,
      }),
      IsOptional(),
      Type(() => Number),
      IsNumber({}, { message: 'Must be a number' }),
    ];

    if (min !== undefined) decorators.push(Min(min));
    if (max !== undefined) decorators.push(Max(max));

    applyDecorators(...decorators)(target, propertyKey);
  };
}

// Optional Boolean
export function OptionalBooleanField(
  options: Omit<ValidatorOptions, 'type'> = {},
) {
  return (target: any, propertyKey: string) => {
    const {
      example,
      description,
      default: defaultValue,
      ...restOptions
    } = options;

    const decorators = [
      ApiProperty({
        ...restOptions,
        type: Boolean,
        required: false,
        example,
        description,
        default: defaultValue,
      }),
      IsOptional(),
      Type(() => Boolean),
      IsBoolean(),
    ];

    applyDecorators(...decorators)(target, propertyKey);
  };
}

// Optional Date
export function OptionalDateField(
  options: Omit<ValidatorOptions, 'type'> = {},
) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      type: Date,
      required: false,
    })(target, propertyKey);
    IsOptional()(target, propertyKey);
    Type(() => Date)(target, propertyKey);
    IsDate()(target, propertyKey);
  };
}

// Optional Enum
export function OptionalEnumField(
  enumObj: any,
  options: Omit<ValidatorOptions, 'type' | 'enum'> = {},
) {
  return (target: any, propertyKey: string) => {
    ApiPropertyWithValidator({
      ...options,
      enum: enumObj,
      required: false,
    })(target, propertyKey);
    IsOptional()(target, propertyKey);
    IsEnum(enumObj)(target, propertyKey);
  };
}

// Optional Array
export function OptionalArrayField(
  options: Omit<ValidatorOptions, 'type' | 'isArray'> = {},
) {
  return (target: any, propertyKey: string) => {
    const { description, example, ...restOptions } = options;

    const decorators = [
      ApiProperty({
        ...restOptions,
        type: [String],
        isArray: true,
        required: false,
        description,
        example,
      }),
      IsOptional(),
      IsArray(),
    ];

    applyDecorators(...decorators)(target, propertyKey);
  };
}

// Optional Object
export function OptionalObjectField(
  options: Omit<ValidatorOptions, 'type' | 'isArray'> = {},
) {
  return (target: any, propertyKey: string) => {
    const { description, example, ...restOptions } = options;
    const decorators = [
      ApiProperty({
        ...restOptions,
        type: Object,
        description,
        example,
        required: false,
      }),
      IsOptional(),
      IsObject(),
    ];
    applyDecorators(...decorators)(target, propertyKey);
  };
}

// Integer Field (for whole numbers)
export function IntegerField(options: Omit<ValidatorOptions, 'type'> = {}) {
  return (target: any, propertyKey: string) => {
    const {
      min,
      max,
      description,
      example,
      default: defaultValue,
      ...restOptions
    } = options;
    const decorators = [
      ApiProperty({
        ...restOptions,
        type: Number,
        format: 'int32',
        description,
        example,
        default: defaultValue,
        required: true,
      }),
      Type(() => Number),
      IsInt(),
    ];
    if (min !== undefined) {
      decorators.push(Min(min));
    }
    if (max !== undefined) {
      decorators.push(Max(max));
    }
    applyDecorators(...decorators)(target, propertyKey);
  };
}

// Optional Integer Field
export function OptionalIntegerField(
  options: Omit<ValidatorOptions, 'type'> = {},
) {
  return (target: any, propertyKey: string) => {
    const { min, max, description, example, ...restOptions } = options;
    const decorators = [
      ApiProperty({
        ...restOptions,
        type: Number,
        format: 'int32',
        description,
        example,
        required: false,
      }),
      IsOptional(),
      Type(() => Number),
      IsInt(),
    ];
    if (min !== undefined) {
      decorators.push(Min(min));
    }
    if (max !== undefined) {
      decorators.push(Max(max));
    }
    applyDecorators(...decorators)(target, propertyKey);
  };
}

// Positive Number Field
export function PositiveNumberField(
  options: Omit<ValidatorOptions, 'type'> = {},
) {
  return (target: any, propertyKey: string) => {
    const { description, example, ...restOptions } = options;
    const decorators = [
      ApiProperty({
        ...restOptions,
        type: Number,
        description,
        example,
        required: true,
        minimum: 0,
      }),
      Type(() => Number),
      IsPositive(),
    ];
    applyDecorators(...decorators)(target, propertyKey);
  };
}

// Optional Positive Number Field
export function OptionalPositiveNumberField(
  options: Omit<ValidatorOptions, 'type'> = {},
) {
  return (target: any, propertyKey: string) => {
    const { description, example, ...restOptions } = options;
    const decorators = [
      ApiProperty({
        ...restOptions,
        type: Number,
        description,
        example,
        required: false,
        minimum: 0,
      }),
      IsOptional(),
      Type(() => Number),
      IsPositive(),
    ];
    applyDecorators(...decorators)(target, propertyKey);
  };
}

// Transform string to number (useful for query params and form data)
export function TransformToNumber() {
  return Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return value;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  });
}

// Transform string to boolean (useful for query params and form data)
export function TransformToBoolean() {
  return Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
  });
}
