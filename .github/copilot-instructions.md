# NestJS Application Guidelines

## Code Style

- Use TypeScript strict mode. Enable `strictNullChecks`, `noImplicitAny`, and `strict` in `tsconfig.json`.
- Prefer `readonly` for injected dependencies and immutable properties.
- Use single quotes, trailing commas, and 2-space indentation (enforce via Prettier).
- Name files using kebab-case: `user-profile.controller.ts`, `user-profile.service.ts`, `user-profile.module.ts`.
- Name classes using PascalCase with the appropriate suffix: `UserProfileController`, `UserProfileService`, `UserProfileModule`.
- Name DTOs with a `Dto` suffix: `CreateUserDto`, `UpdateUserDto`.
- Name entities with an `.entity.ts` suffix and use PascalCase class names.

## Architecture

- Follow the **modular architecture**: every feature gets its own module containing its controller, service, DTOs, entities, and tests.
- Organize by feature, not by layer:
  ```
  src/
    users/
      dto/
      entities/
      users.controller.ts
      users.service.ts
      users.module.ts
    auth/
      guards/
      strategies/
      auth.controller.ts
      auth.service.ts
      auth.module.ts
    common/
      decorators/
      filters/
      guards/
      interceptors/
      pipes/
  ```
- Keep controllers thin — delegate all business logic to services.
- Use the `common/` module for shared decorators, filters, guards, interceptors, and pipes.
- Use `ConfigModule` with `@nestjs/config` for environment configuration. Never hardcode secrets or connection strings.
- Use dependency injection exclusively. Never instantiate services manually with `new`.

## Dependency Injection

- Always inject dependencies through the constructor.
- Use custom providers (`useFactory`, `useClass`, `useValue`) when advanced DI is needed.
- Scope providers as `DEFAULT` (singleton) unless there's a specific reason for `REQUEST` or `TRANSIENT` scope.
- Use `@Inject()` with string/symbol tokens only for non-class providers.

## Controllers

- Use appropriate HTTP method decorators: `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`.
- Use `@Body()`, `@Param()`, `@Query()` decorators for extracting request data.
- Apply `class-validator` decorators on DTOs and enable the global `ValidationPipe`.
- Return consistent response shapes. Use interceptors for response transformation if needed.
- Version APIs using URI versioning (`@Controller({ version: '1' })`) when applicable.

## Services

- Services contain business logic and interact with repositories/data sources.
- Throw NestJS built-in HTTP exceptions (`NotFoundException`, `BadRequestException`, etc.) or custom exceptions.
- Keep services focused on a single domain. Extract shared logic into dedicated services.

## DTOs and Validation

- Create separate DTOs for create and update operations (`CreateUserDto`, `UpdateUserDto`).
- Use `PartialType()`, `PickType()`, `OmitType()`, and `IntersectionType()` from `@nestjs/mapped-types` to derive DTOs.
- Apply `class-validator` decorators (`@IsString()`, `@IsEmail()`, `@IsOptional()`, etc.) to all DTO properties.
- Apply `class-transformer` decorators (`@Transform()`, `@Exclude()`, `@Expose()`) for serialization control.
- Enable `whitelist: true` and `forbidNonWhitelisted: true` in the global `ValidationPipe` to strip/reject unknown properties.

## Database and ORM

- Use TypeORM or Prisma as the ORM. Follow the repository pattern with TypeORM or Prisma service pattern.
- Define entities in `*.entity.ts` files within the feature module.
- Use migrations for all schema changes — never use `synchronize: true` in production.
- Use transactions for operations that modify multiple tables.
- Use query builders or raw queries only when the ORM abstraction is insufficient for performance.

## Authentication and Authorization

- Use `@nestjs/passport` with Passport strategies (JWT, OAuth, etc.) for authentication.
- Implement guards (`@UseGuards()`) for route protection. Prefer global guards for app-wide auth.
- Use custom decorators (e.g., `@CurrentUser()`) to extract the authenticated user from requests.
- Implement role-based or policy-based access control with dedicated guards.
- Store secrets (JWT secret, API keys) in environment variables via `ConfigService`.

## Error Handling

- Use NestJS built-in exception classes (`HttpException` subclasses) for HTTP errors.
- Implement a global exception filter (`@Catch()`) for centralized error handling and consistent error response format.
- Log errors with meaningful context using the built-in `Logger` or a structured logging library.
- Never expose stack traces or internal details in production error responses.

## Testing

- Write unit tests for services (mock dependencies with `jest.fn()` or `@nestjs/testing`).
- Write integration tests for controllers using `Test.createTestingModule()`.
- Write e2e tests using `supertest` with the full application bootstrap.
- Place test files adjacent to the code they test: `users.service.spec.ts` next to `users.service.ts`.
- Use `overrideProvider()` in test modules to substitute real implementations with mocks.
- Target meaningful coverage on business logic — avoid testing trivial getters/setters.

## Security

- Enable CORS with explicit origins — avoid wildcard `*` in production.
- Use `helmet` middleware for HTTP security headers.
- Enable rate limiting with `@nestjs/throttler`.
- Sanitize and validate all user input via `ValidationPipe` and `class-validator`.
- Use parameterized queries (provided by the ORM) — never concatenate user input into queries.
- Implement CSRF protection for cookie-based authentication.

## Performance

- Use caching with `@nestjs/cache-manager` and the `@CacheKey()` / `@CacheTTL()` decorators for expensive operations.
- Use `@nestjs/bull` or `@nestjs/bullmq` for background job processing and queues.
- Enable compression middleware for response payloads.
- Use pagination for list endpoints — never return unbounded result sets.
- Use lazy-loading for modules that are not needed at startup.

## Logging and Monitoring

- Use the built-in `Logger` service or integrate a structured logger (e.g., `pino`, `winston`).
- Inject `Logger` and set the context to the class name: `private readonly logger = new Logger(UsersService.name)`.
- Log at appropriate levels: `error` for failures, `warn` for recoverable issues, `log`/`debug` for operational info.
- Add correlation IDs to requests for distributed tracing.

## Configuration

- Use `@nestjs/config` with `.env` files and validation schemas (Joi or `class-validator`).
- Define a configuration namespace per module for complex configs.
- Access config via `ConfigService` injection — never use `process.env` directly in services.
- Validate all environment variables at application startup.

## Swagger / OpenAPI

- Use `@nestjs/swagger` with `DocumentBuilder` and `SwaggerModule` to generate OpenAPI docs at `/docs`.
- Add `@ApiTags()` on every controller to group endpoints by feature (e.g., `@ApiTags('Trips')`).
- Add `@ApiOperation({ summary: '...' })` on every route handler to describe the endpoint purpose.
- Add `@ApiBearerAuth('access-token')` on controllers/routes that require JWT authentication.
- Annotate path and query parameters with `@ApiParam()` and `@ApiQuery()`.
- Decorate every DTO property with `@ApiProperty()` or `@ApiPropertyOptional()` including `description`, `example`, and `format` where appropriate.
- Use `PartialType()` from `@nestjs/swagger` (not `@nestjs/mapped-types`) for update DTOs so the Swagger schema correctly marks all fields as optional.
- Create dedicated response DTO classes (e.g., `TripResponseDto`, `AuthResponseDto`) — never return raw entities from controllers.
- Add explicit Swagger response decorators on every route handler:
  - `@ApiOkResponse({ type: ResponseDto })` or `@ApiCreatedResponse({ type: ResponseDto })` for success.
  - `@ApiNotFoundResponse()`, `@ApiUnauthorizedResponse()`, `@ApiBadRequestResponse()` for error cases.
  - Use `isArray: true` when returning arrays: `@ApiOkResponse({ type: Dto, isArray: true })`.
- Add explicit return type annotations on all controller methods (e.g., `): Promise<TripResponseDto>`).
- Implement runtime response mapping in services (entity → response DTO) with private mapper methods (e.g., `toTripResponse(trip)`) to ensure JSON output matches the documented schema.
- Create a shared `DeleteResponseDto` in `common/dto/` for all delete endpoints.
- Enable `persistAuthorization: true` in `SwaggerModule.setup()` options so the token survives page reloads during development.
- Keep a programmatic schema generator script in `src/scripts/generate-swagger.ts` that creates `openapi.json` via `SwaggerModule.createDocument()` without calling `app.listen()`.
- Add and maintain a package script `swagger:generate` (e.g., `ts-node src/scripts/generate-swagger.ts`) so schema export does not require a running server.
- Run `yarn swagger:generate` after API contract changes (routes/DTOs/responses/guards) and commit the updated `openapi.json` when API docs are versioned in the repository.
- Reuse the same `DocumentBuilder` config (title, description, version, bearer scheme) in both app bootstrap and generator script to prevent schema drift.

## Build and Test

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run start:dev    # Start in watch mode
npm run test         # Run unit tests
npm run test:e2e     # Run e2e tests
npm run lint         # Lint with ESLint
```

## Conventions

- Always register providers and controllers in their owning module.
- Export only what downstream modules need — keep module internals private.
- Use barrel exports (`index.ts`) sparingly and only at module boundaries.
- Prefer async/await over raw Promises or callbacks.
- Use `forRoot()` / `forRootAsync()` for dynamic modules that accept configuration.
- Use `forFeature()` for registering entities or sub-features within a module.
- Use interceptors for cross-cutting concerns (logging, caching, response mapping).
- Use pipes for input transformation and validation.
- Use guards for authentication and authorization checks.
- Use middleware for low-level request processing (e.g., request logging, CORS).
