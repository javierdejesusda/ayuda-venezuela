/**
 * Renders the OpenAPI 3.1 document as readable Markdown. The goal is a single
 * self-contained file that a code agent (or a human) can consume as context:
 * every endpoint, parameter, enum and schema in one place. Derived from the same
 * `openApiDocument`, so it never drifts from the JSON contract.
 */

interface SchemaLike {
  type?: string;
  description?: string;
  nullable?: boolean;
  format?: string;
  enum?: readonly unknown[];
  properties?: Record<string, SchemaLike>;
  required?: readonly string[];
  items?: SchemaLike;
  additionalProperties?: SchemaLike | boolean;
  $ref?: string;
  allOf?: readonly SchemaLike[];
}

interface ParameterLike {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: SchemaLike;
}

interface ResponseLike {
  description?: string;
  content?: Record<string, { schema?: SchemaLike }>;
}

interface OperationLike {
  tags?: readonly string[];
  summary?: string;
  description?: string;
  parameters?: readonly ParameterLike[];
  responses?: Record<string, ResponseLike>;
}

interface OpenApiLike {
  openapi?: string;
  info?: { title?: string; version?: string; description?: string; license?: { name?: string } };
  servers?: readonly { url?: string; description?: string }[];
  paths?: Record<string, Record<string, OperationLike>>;
  components?: { schemas?: Record<string, SchemaLike> };
}

/** Last segment of a `#/components/schemas/Name` reference. */
function refName(ref: string): string {
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

/** Sanitizes a value for a Markdown table cell (no pipes, no newlines). */
function cell(value: string): string {
  return value.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
}

/** Human-readable type label for a schema (resolves refs, arrays, enums). */
function typeLabel(schema: SchemaLike | undefined): string {
  if (!schema) return 'any';
  if (schema.$ref) return refName(schema.$ref);
  if (schema.allOf && schema.allOf.length > 0) {
    return schema.allOf.map((entry) => typeLabel(entry)).join(' & ');
  }

  let base: string;
  if (schema.type === 'array') {
    base = `${typeLabel(schema.items)}[]`;
  } else if (
    schema.type === 'object' &&
    schema.additionalProperties &&
    typeof schema.additionalProperties === 'object'
  ) {
    base = `object<string, ${typeLabel(schema.additionalProperties)}>`;
  } else if (schema.type === 'object' && schema.properties) {
    const inner = Object.entries(schema.properties)
      .map(([key, value]) => `${key}: ${typeLabel(value)}`)
      .join(', ');
    base = `{ ${inner} }`;
  } else {
    base = schema.type ?? 'object';
  }

  if (schema.enum && schema.enum.length > 0) {
    base += ` (enum: ${schema.enum.join(', ')})`;
  } else if (schema.format) {
    base += ` (${schema.format})`;
  }
  if (schema.nullable) base += ' | null';
  return base;
}

/** Type label for the application/json body of a response, if any. */
function responseSchemaLabel(response: ResponseLike): string {
  const json = response.content?.['application/json'];
  if (!json?.schema) return '';
  return typeLabel(json.schema);
}

/** Appends a schema's field table, flattening any allOf / $ref composition. */
function renderSchemaBody(
  lines: string[],
  schema: SchemaLike,
  schemas: Record<string, SchemaLike>,
): void {
  const props: Record<string, SchemaLike> = {};
  const required = new Set<string>();

  const collect = (current: SchemaLike): void => {
    if (current.$ref) {
      const target = schemas[refName(current.$ref)];
      if (target) collect(target);
      return;
    }
    if (current.allOf) current.allOf.forEach(collect);
    if (current.properties) {
      for (const [key, value] of Object.entries(current.properties)) props[key] = value;
    }
    if (current.required) current.required.forEach((name) => required.add(name));
  };
  collect(schema);

  const entries = Object.entries(props);
  if (entries.length === 0) return;

  lines.push('| Campo | Tipo | Requerido | Descripcion |');
  lines.push('| --- | --- | --- | --- |');
  for (const [field, fieldSchema] of entries) {
    const req = required.has(field) ? 'si' : 'no';
    lines.push(
      `| ${field} | ${cell(typeLabel(fieldSchema))} | ${req} | ${cell(fieldSchema.description ?? '')} |`,
    );
  }
  lines.push('');
}

/** Converts an OpenAPI document into a single Markdown reference. */
export function openApiToMarkdown(doc: OpenApiLike): string {
  const lines: string[] = [];
  const info = doc.info ?? {};

  lines.push(`# ${info.title ?? 'API'}`);
  lines.push('');
  if (info.description) {
    lines.push(`> ${info.description}`);
    lines.push('');
  }
  lines.push(`- Version: ${info.version ?? ''}`);
  lines.push(`- OpenAPI: ${doc.openapi ?? ''}`);
  const server = doc.servers?.[0];
  if (server?.url) {
    lines.push(`- Servidor: \`${server.url}\`${server.description ? ` (${server.description})` : ''}`);
  }
  if (info.license?.name) lines.push(`- Licencia: ${info.license.name}`);
  lines.push('- Especificacion (OpenAPI JSON): `/api/v1/openapi.json`');
  lines.push('');

  lines.push('## Endpoints');
  lines.push('');
  for (const [path, methods] of Object.entries(doc.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      lines.push(`### ${method.toUpperCase()} ${path}`);
      lines.push('');
      if (operation.summary) {
        lines.push(operation.summary);
        lines.push('');
      }
      if (operation.description) {
        lines.push(operation.description);
        lines.push('');
      }
      if (operation.tags && operation.tags.length > 0) {
        lines.push(`Tags: ${operation.tags.join(', ')}`);
        lines.push('');
      }

      const params = operation.parameters ?? [];
      if (params.length > 0) {
        lines.push('Parametros:');
        lines.push('');
        lines.push('| Nombre | En | Requerido | Tipo | Descripcion |');
        lines.push('| --- | --- | --- | --- | --- |');
        for (const param of params) {
          const req = param.required ? 'si' : 'no';
          lines.push(
            `| ${param.name} | ${param.in} | ${req} | ${cell(typeLabel(param.schema))} | ${cell(param.description ?? '')} |`,
          );
        }
        lines.push('');
      }

      const responses = operation.responses ?? {};
      if (Object.keys(responses).length > 0) {
        lines.push('Respuestas:');
        lines.push('');
        for (const [status, response] of Object.entries(responses)) {
          const schemaLabel = responseSchemaLabel(response);
          const tail = schemaLabel ? ` -> ${schemaLabel}` : '';
          lines.push(`- \`${status}\` ${response.description ?? ''}${tail}`.trimEnd());
        }
        lines.push('');
      }
    }
  }

  const schemas = doc.components?.schemas ?? {};
  if (Object.keys(schemas).length > 0) {
    lines.push('## Esquemas');
    lines.push('');
    for (const [name, schema] of Object.entries(schemas)) {
      lines.push(`### ${name}`);
      lines.push('');
      if (schema.description) {
        lines.push(schema.description);
        lines.push('');
      }
      renderSchemaBody(lines, schema, schemas);
    }
  }

  return `${lines.join('\n').trim()}\n`;
}
