"use server";

import { auth, ClerkMiddlewareAuthObject } from "@clerk/nextjs/server";

type AuthResult<T extends boolean> = T extends true
  ? ClerkMiddlewareAuthObject & { userId: string }
  : ClerkMiddlewareAuthObject;

export async function protectAction<T extends boolean>(
  actionName: string,
  authRequired: T
): Promise<AuthResult<T>> {
  console.log("protectAction", actionName, authRequired);

  const user = await auth();

  if (authRequired && (!user || !user.userId)) {
    throw new Error("Unauthorized");
  }
  return user as AuthResult<T>;
}
