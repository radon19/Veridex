// Raw Cognito password auth — no Amplify dep (public client + USER_PASSWORD_AUTH)
const REGION = process.env.NEXT_PUBLIC_COGNITO_REGION ?? "ap-south-1";
const POOL = process.env.NEXT_PUBLIC_COGNITO_POOL ?? "";
const CLIENT = process.env.NEXT_PUBLIC_COGNITO_CLIENT ?? "";

export const cognitoReady = () => Boolean(POOL && CLIENT);
void POOL;

export async function signIn(username: string, password: string) {
  const r = await fetch(`https://cognito-idp.${REGION}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT,
      AuthParameters: { USERNAME: username, PASSWORD: password },
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.message || "sign-in failed");
  if (j.ChallengeName) throw new Error("first-login password reset needed — do it in console once");
  sessionStorage.setItem("veridex-idtoken", j.AuthenticationResult.IdToken);
  return j.AuthenticationResult.IdToken as string;
}

export const idToken = () =>
  typeof sessionStorage === "undefined" ? null : sessionStorage.getItem("veridex-idtoken");

export const signOut = () => sessionStorage.removeItem("veridex-idtoken");

export const authHeader = (): Record<string, string> => {
  const t = idToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};
