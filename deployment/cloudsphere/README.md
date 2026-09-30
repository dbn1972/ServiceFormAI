# CloudSphere Coexistence Deployment

This Compose project isolates ServiceFormAI from applications already running on the host:

- Frontend binds to `127.0.0.1:3100` only; the host Nginx configuration is untouched.
- Backend, PostgreSQL, and Redis are reachable only on the Compose network. S3 uses the EC2 instance role and a dedicated ServiceFormAI bucket.
- Persistent volumes use the `serviceformai-cloudsphere-` prefix.
- Database migrations run before the API starts; schema synchronization remains disabled.

Create `deployment/cloudsphere/.env.cloudsphere` from `.env.cloudsphere.example` and replace all placeholder secrets with independent random values. Keep the file mode `0600`; it is excluded from Docker build context.

Start or update the stack from the project root:

```sh
docker compose -p serviceformai-cloudsphere --env-file deployment/cloudsphere/.env.cloudsphere -f deployment/cloudsphere/compose.yaml up --build -d --wait
```

Access it locally on the server at `http://127.0.0.1:3100`. To view it from a workstation, create an SSH tunnel:

```sh
ssh -L 3100:127.0.0.1:3100 cloudsphere-ec3
```

Then open `http://localhost:3100`. This avoids changing the existing public Nginx routes or exposing a new host port. For public access, configure a dedicated TLS hostname and Nginx virtual host separately.

The fixed OTP override is disabled by default. For isolated testing, enable it for one dedicated Indian mobile in E.164 format; the code is accepted only for that exact mobile and delivery is skipped only for that mobile. Never point it at a real user's account. All other numbers still require a production HTTPS OTP provider and API key. Tenant staff login requires a dedicated OIDC issuer/client; do not reuse another application's realm. The backend uses the EC2 IAM role for S3 when explicit AWS keys are unset, and the bucket must grant the instance role read/write access.

For isolated OTP testing only, use `compose.test-otp.override.yaml` with `OTP_FIXED_TEST_MOBILE` set in the private environment file. This opt-in override leaves the default Compose configuration unchanged.
