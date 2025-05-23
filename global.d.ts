export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      organizationId?: string;
    };
  }
}
