import { z } from 'zod';

import { recordIdSchema } from '@/schemas/common';
import { UPLOAD_FILE_MUTATION } from '@/schemas/graphqlQueries';
import { defineTool } from '@/tools/toolDefinition';

export const uploadFileTool = defineTool({
  name: 'upload_file',
  title: 'Upload file',
  description:
    'Upload a file for a file/attachment field. Provide the field metadata id and the file content as base64. Returns the stored file path and a signed URL.',
  inputSchema: {
    fieldMetadataId: recordIdSchema.describe(
      'The metadata id of the file/attachment field to upload into.',
    ),
    filename: z.string().min(1),
    contentBase64: z
      .string()
      .min(1)
      .describe('File contents encoded as a base64 string.'),
  },
  handler: (client, { fieldMetadataId, filename, contentBase64 }) =>
    client.uploadFile({
      endpoint: 'metadata',
      query: UPLOAD_FILE_MUTATION,
      variables: { fieldMetadataId },
      file: Buffer.from(contentBase64, 'base64'),
      filename,
    }),
});

export const fileTools = [uploadFileTool];
