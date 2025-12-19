import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google"
import { Password } from "@convex-dev/auth/providers/Password"

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    Password({
      profile(params, config) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
  ],
});
