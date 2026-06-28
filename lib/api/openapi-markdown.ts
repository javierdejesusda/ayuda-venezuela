/**
 * Renders the OpenAPI 3.1 document as a single, SELF-CONTAINED Markdown file: a
 * code agent (or a human) can use it as the only source needed to call the API.
 * It carries the absolute base URL, how-to-use notes, every endpoint with full
 * URLs, runnable curl examples and example JSON responses, plus the schemas.
 * Derived from the same `openApiDocument`, so it never drifts from the contract.
 */

interface SchemaLike {
  type?: string;
  description?: string;
  nullable?: boolean;
  format?: string;
  default?: unknown;
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
  paths?: Record<string, Record<string, OperationLike>>;
  components?: { schemas?: Record<string, SchemaLike> };
}

type SchemaMap = Record<string, SchemaLike>;

const SAMPLE_UUID = '123e4567-e89b-12d3-a456-426614174000';
const SAMPLE_DATETIME = '2026-06-28T12:00:00.000Z';

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

/** A representative example string for a primitive given its format. */
function exampleForString(format?: string): string {
  if (format === 'uuid') return SAMPLE_UUID;
  if (format === 'date-time') return SAMPLE_DATETIME;
  if (format === 'uri') return 'https://ejemplo.org';
  return 'texto';
}

/** Builds an example value for a schema, resolving refs and composition. */
function schemaExample(schema: SchemaLike | undefined, schemas: SchemaMap, depth = 0): unknown {
  // Bound recursion as a safety net; the contract has no cyclic refs, so this is
  // only a guard against an accidental loop, set well above the real nesting.
  if (!schema || depth > 12) return null;
  if (schema.$ref) return schemaExample(schemas[refName(schema.$ref)], schemas, depth + 1);
  if (schema.allOf && schema.allOf.length > 0) {
    let merged: Record<string, unknown> = {};
    for (const part of schema.allOf) {
      const value = schemaExample(part, schemas, depth + 1);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged = { ...merged, ...(value as Record<string, unknown>) };
      }
    }
    return merged;
  }
  if (schema.enum && schema.enum.length > 0) return schema.enum[0];
  if (schema.type === 'array') return [schemaExample(schema.items, schemas, depth + 1)];
  if (schema.properties) {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      obj[key] = schemaExample(value, schemas, depth + 1);
    }
    return obj;
  }
  if (schema.type === 'object' && schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    return { ejemplo: schemaExample(schema.additionalProperties, schemas, depth + 1) };
  }
  switch (schema.type) {
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'object':
      return {};
    default:
      return exampleForString(schema.format);
  }
}

/** application/json schema of a response, if present. */
function jsonSchema(response: ResponseLike): SchemaLike | undefined {
  return response.content?.['application/json']?.schema;
}

/** Appends a schema's field table, flattening any allOf / $ref composition. */
function renderSchemaBody(lines: string[], schema: SchemaLike, schemas: SchemaMap): void {
  const props: SchemaMap = {};
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

/** The how-to-use section: everything an agent needs before calling the API. */
function renderUsage(lines: string[], base: string): void {
  const example = base || '';
  lines.push('## Como usar la API');
  lines.push('');
  lines.push(`- URL base: \`${base || '/'}\``);
  lines.push('- Autenticacion: ninguna. La API es publica y de solo lectura (unicamente metodos GET).');
  lines.push(
    '- Formato: JSON en toda respuesta. CORS abierto (Access-Control-Allow-Origin: *), se puede ' +
      'consumir desde el navegador.',
  );
  lines.push(
    '- Cache: las respuestas se cachean en el borde (Cache-Control: public, s-maxage=30, ' +
      'stale-while-revalidate=60). Los datos pueden tener unos segundos de retraso.',
  );
  lines.push(
    '- Envelope de exito: `{ "data": ..., "pagination": { "total": number, "nextCursor": number | null } }` ' +
      '(pagination solo en endpoints de lista).',
  );
  lines.push('- Envelope de error: `{ "error": { "code": string, "message": string } }`.');
  lines.push(
    '- Paginacion: usa `limit` (maximo 100, por defecto 20) y `cursor` (desplazamiento, por defecto 0). ' +
      'Toma el `nextCursor` de la respuesta para pedir la siguiente pagina; cuando es `null` no hay mas.',
  );
  lines.push(
    `- Privacidad: el contacto del reportero aparece solo en el detalle \`GET ${example}/api/v1/zonas/{id}\`, ` +
      'nunca en listados. Las coordenadas vienen con precision reducida (~110m).',
  );
  lines.push('');
  lines.push('### Ejemplo rapido');
  lines.push('');
  lines.push('```bash');
  lines.push(`curl "${example}/api/v1/zonas?limit=5"`);
  lines.push('```');
  lines.push('');
}

/**
 * Converts an OpenAPI document into a single self-contained Markdown reference.
 * Pass `baseUrl` (absolute, no trailing slash) so every URL is directly callable.
 */
export function openApiToMarkdown(doc: OpenApiLike, baseUrl?: string): string {
  const lines: string[] = [];
  const info = doc.info ?? {};
  const base = (baseUrl ?? '').replace(/\/$/, '');
  const schemas = doc.components?.schemas ?? {};

  lines.push(`# ${info.title ?? 'API'}`);
  lines.push('');
  if (info.description) {
    lines.push(`> ${info.description}`);
    lines.push('');
  }
  lines.push(`- Version: ${info.version ?? ''}`);
  lines.push(`- OpenAPI: ${doc.openapi ?? ''}`);
  if (info.license?.name) lines.push(`- Licencia: ${info.license.name}`);
  lines.push(`- Especificacion (OpenAPI JSON): \`${base}/api/v1/openapi.json\``);
  lines.push('');

  renderUsage(lines, base);

  lines.push('## Endpoints');
  lines.push('');
  for (const [path, methods] of Object.entries(doc.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      const verb = method.toUpperCase();
      lines.push(`### ${verb} ${base}${path}`);
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
        lines.push('| Nombre | En | Requerido | Tipo | Default | Descripcion |');
        lines.push('| --- | --- | --- | --- | --- | --- |');
        for (const param of params) {
          const req = param.required ? 'si' : 'no';
          const def = param.schema?.default;
          const defLabel = def === undefined ? '' : String(def);
          lines.push(
            `| ${param.name} | ${param.in} | ${req} | ${cell(typeLabel(param.schema))} | ${cell(defLabel)} | ${cell(param.description ?? '')} |`,
          );
        }
        lines.push('');
      }

      const callUrl = `${base}${path}`.replace('{id}', SAMPLE_UUID);
      lines.push('Ejemplo:');
      lines.push('');
      lines.push('```bash');
      lines.push(`curl "${callUrl}"`);
      lines.push('```');
      lines.push('');

      const responses = operation.responses ?? {};
      if (Object.keys(responses).length > 0) {
        lines.push('Respuestas:');
        lines.push('');
        for (const [status, response] of Object.entries(responses)) {
          const schema = jsonSchema(response);
          const tail = schema ? ` -> ${typeLabel(schema)}` : '';
          lines.push(`- \`${status}\` ${response.description ?? ''}${tail}`.trimEnd());
          if (schema) {
            lines.push('');
            lines.push('```json');
            lines.push(JSON.stringify(schemaExample(schema, schemas), null, 2));
            lines.push('```');
          }
        }
        lines.push('');
      }
    }
  }

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
