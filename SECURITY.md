# Security Policy

This project is a gateway for AI API traffic. Treat it as infrastructure.

## Do Not Commit

- Provider API keys
- User prompts or private logs
- `.env` files
- Production hostnames that should remain private

## Recommended Deployment Posture

- Run the gateway server-side.
- Put authentication in front of public deployments.
- Use trusted upstream providers only.
- Avoid sending sensitive user data to third-party providers you do not control.
- Rotate provider keys if they are exposed.

## Reporting Issues

Open an issue for non-sensitive security improvements.

For sensitive reports, contact the maintainer privately through GitHub and include the smallest useful reproduction.
