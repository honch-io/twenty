// Metadata GraphQL operations. Object/field mutation shapes were taken from
// twenty-server's metadata resolvers and DTOs (createOneObject/createOneField/
// updateOneField/webhooks).

const FIELD_NODE_SELECTION = `
  id
  type
  name
  label
  description
  icon
  isNullable
  isUnique
  isCustom
  isSystem
  isActive
  defaultValue
  options
  settings
`;

export const buildObjectsIntrospectionQuery = (
  includeInactive: boolean,
): string => {
  const activeFilter = includeInactive
    ? ''
    : ', filter: {isActive: {is: true}}';
  const activeFieldFilter = includeInactive
    ? ''
    : ', filter: {isActive: {is: true}}';

  return `query GetObjects {
    objects(paging: {first: 1000}${activeFilter}) {
      edges {
        node {
          id
          nameSingular
          namePlural
          labelSingular
          labelPlural
          description
          icon
          isCustom
          isSystem
          isActive
          fields(paging: {first: 1000}${activeFieldFilter}) {
            edges {
              node {${FIELD_NODE_SELECTION}}
            }
          }
        }
      }
    }
  }`;
};

export const CREATE_OBJECT_MUTATION = `
  mutation CreateObject($input: CreateOneObjectInput!) {
    createOneObject(input: $input) {
      id
      nameSingular
      namePlural
      labelSingular
      labelPlural
      isCustom
    }
  }
`;

export const UPDATE_OBJECT_MUTATION = `
  mutation UpdateObject($input: UpdateOneObjectInput!) {
    updateOneObject(input: $input) {
      id
      nameSingular
      namePlural
      labelSingular
      labelPlural
    }
  }
`;

export const CREATE_FIELD_MUTATION = `
  mutation CreateField($input: CreateOneFieldMetadataInput!) {
    createOneField(input: $input) {
      id
      name
      label
      type
      objectMetadataId
    }
  }
`;

export const UPDATE_FIELD_MUTATION = `
  mutation UpdateField($input: UpdateOneFieldMetadataInput!) {
    updateOneField(input: $input) {
      id
      name
      label
      type
    }
  }
`;

export const LIST_WEBHOOKS_QUERY = `
  query Webhooks {
    webhooks {
      id
      targetUrl
      operations
      description
    }
  }
`;

export const CREATE_WEBHOOK_MUTATION = `
  mutation CreateWebhook($input: CreateWebhookInput!) {
    createWebhook(input: $input) {
      id
      targetUrl
      operations
      description
    }
  }
`;

export const DELETE_WEBHOOK_MUTATION = `
  mutation DeleteWebhook($id: UUID!) {
    deleteWebhook(id: $id) {
      id
    }
  }
`;

export const UPLOAD_FILE_MUTATION = `
  mutation UploadFile($file: Upload!, $fieldMetadataId: String!) {
    uploadFilesFieldFile(file: $file, fieldMetadataId: $fieldMetadataId) {
      id
      path
      size
      url
      createdAt
    }
  }
`;
