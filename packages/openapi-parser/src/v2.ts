import YAML from 'yaml';
import swagger2openapi, { type ConvertOutputOptions } from 'swagger2openapi';

import { OpenAPIParseError } from './error';
import { parseOpenAPIV3 } from './v3';
import type { Filesystem, OpenAPIV3xDocument } from './types';
import type { ParseOpenAPIInput } from './parse';

/**
 * Convert a Swagger 2.0 schema to an OpenAPI 3.0 schema.
 */
export async function convertOpenAPIV2ToOpenAPIV3(
    input: ParseOpenAPIInput,
): Promise<Filesystem<OpenAPIV3xDocument>> {
    const { value, rootURL } = input;
    // In this case we want the raw value to be able to convert it.
    const schema = typeof value === 'string' ? rawParseOpenAPI({ value, rootURL }) : value;
    try {
        // @ts-expect-error Types are incompatible between the two libraries
        const convertResult = (await swagger2openapi.convertObj(schema, {
            resolve: false,
            resolveInternal: false,
            laxDefaults: true,
            laxurls: true,
            lint: false,
            prevalidate: false,
            anchors: true,
            patch: true,
        })) as ConvertOutputOptions;

        return parseOpenAPIV3({ ...input, rootURL, value: convertResult.openapi });
    } catch (error) {
        if (error instanceof Error && error.name === 'S2OError') {
            throw new OpenAPIParseError('Failed to convert Swagger 2.0 to OpenAPI 3.0', {
                code: 'v2-conversion',
                rootURL,
                cause: error,
            });
        } else {
            throw error;
        }
    }
}

/**
 * Parse the config file from a raw string.
 * Useful to get the raw object from a file.
 */
function rawParseOpenAPI(input: { value: string; rootURL: string | null }): unknown {
    const { value, rootURL } = input;

    // Try with JSON
    try {
        return JSON.parse(value);
    } catch (jsonError) {
        try {
            // Try with YAML
            return YAML.parse(value);
        } catch (yamlError) {
            if (yamlError instanceof Error && yamlError.name.startsWith('YAML')) {
                throw new OpenAPIParseError('Failed to parse YAML: ' + yamlError.message, {
                    code: 'yaml-parse',
                    rootURL,
                });
            }
            throw yamlError;
        }
    }
}
