"use client";

import * as React from "react";
import { OAuthStrategy } from "@clerk/types";
import { useSignIn } from "@clerk/nextjs";
import GoogleIcon from "@/shared/icons/google.svg";
import { Button } from "@/shared/ui/button";

export default function OauthSignIn() {
  const { signIn } = useSignIn();

  if (!signIn) return null;

  const signInWith = (strategy: OAuthStrategy) => {
    return signIn
      .authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: "/cabinet",
      })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        // See https://clerk.com/docs/custom-flows/error-handling
        // for more info on error handling
        console.log(err.errors);
        console.error(err, null, 2);
      });
  };

  // Render a button for each supported OAuth provider
  // you want to add to your app. This example uses only Google.
  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      onClick={() => signInWith("oauth_google")}
    >
      <GoogleIcon />
      Войти через Google
    </Button>
  );
}
