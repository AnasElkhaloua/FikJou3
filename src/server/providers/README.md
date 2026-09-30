# Provider adapters

External email, storage, map/geocoding and rate-limit adapters will live behind narrow capability contracts here when their owning phase selects a provider. Domain modules must not import vendor SDKs directly. Phase 00 intentionally adds no provider implementation.
