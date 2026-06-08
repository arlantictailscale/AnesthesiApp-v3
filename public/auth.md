# auth.md

Welcome, AI agent! AnesthesiApp supports programmatic discovery and authentication.

## How to Register credentials

To interact with our APIs, you need to authenticate. Follow these instructions:

1. **Create an Account:** If you don't have one, visit the [Registration Page](https://anesthesiapp.my.id/signup) to create a user account.
2. **Obtain session or credentials:** Log in to [Login Page](https://anesthesiapp.my.id/login) to obtain your session token.
3. **Protected APIs:** Include your JWT in the `Authorization: Bearer <token>` header of your requests.

## Metadata Endpoints

Our OAuth Protected Resource Metadata is available at:
- **Protected Resource Metadata:** [/.well-known/oauth-protected-resource](https://anesthesiapp.my.id/.well-known/oauth-protected-resource)
- **OAuth Authorization Server Metadata:** [/.well-known/oauth-authorization-server](https://anesthesiapp.my.id/.well-known/oauth-authorization-server)
