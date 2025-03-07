# Glossary

## Passporting

## Grant

The `Grant` object represents access permissions for a specific credential. It has the following properties:

| Property         | Type                | Description                                                                 |
|------------------|---------------------|-----------------------------------------------------------------------------|
| `id`             | `string`            | The unique identifier of the grant.                                         |
| `ownerUserId`    | `string`            | The ID of the user who owns the credential.                                 |
| `consumerAddress` | `string`            | The address of the consumer (the entity granted access).                     |
| `dataId`         | `string`            | The ID of the shared credential data.                                       |
| `lockedUntil`    | `number`            | A timestamp (in milliseconds) until which the grant is locked.             |
| `hash`           | `string` | The content hash of the credential.                             |
