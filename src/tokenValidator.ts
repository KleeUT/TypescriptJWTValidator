import fetch from "node-fetch";
import NodeRSA from "node-rsa";
import Crypto from "crypto";

function decodeAndJsonParse<T>(base64: string): T {
  // Decode the JSON string from Base 64
  const json = new Buffer(base64, "base64").toString("ascii");
  // Return the parsed object
  return JSON.parse(json);
}

export async function isTokenValid(jwt: string, jwksEndpoint: string) {
  const [rawHead, rawBody, signature] = jwt.split(".");

  const parsedHead = decodeAndJsonParse<{ alg: string; kid: string }>(rawHead);
  // Only accepting RS256 singed tokens
  if (parsedHead.alg !== "RS256") {
    return false;
  }

  // Get the key
  const jwksResponse = await fetch(jwksEndpoint);
  // Read the JSON response as a JWKS type
  const jwks: JWKS = (await jwksResponse.json()) as JWKS;

  // Find the key that matches the token
  const jwk = jwks.keys.find((key) => key.kid === parsedHead.kid);

  // Check that a key was found
  if (!jwk) {
    return false;
  }

  // Check that the key is using the correct algorithm
  if (jwk.alg !== "RS256") {
    return false;
  }

  // Make an instance of Node RSA and import the JWK public key components
  const key = new NodeRSA();
  key.importKey(
    {
      n: Buffer.from(jwk.n, "base64"),
      e: Buffer.from(jwk.e, "base64"),
    },
    "components-public"
  );
  // Export the key into the desired formats
  const pem = key.exportKey("pkcs8-public-pem");

  // Create a verify object that can be used to verify the token
  const verifyObject = Crypto.createVerify("RSA-SHA256");
  // Write the base64 encoded head the . character and the base64 encoded body to the stream.
  verifyObject.write(rawHead + "." + rawBody);
  // Close the stream
  verifyObject.end();

  // Important! Normalise the base64 encoding by reading the signature in and writing it out.
  const decodedSignature = Buffer.from(signature, "base64").toString("base64");

  // validate that the signature is correct.
  const signatureIsValid = verifyObject.verify(pem, decodedSignature, "base64");

  return signatureIsValid;
}

type JWKS = {
  keys: JWK[];
};

type JWK = {
  alg: string;
  kty: string;
  use: string;
  n: string;
  e: string;
  kid: string;
  x5t: string;
  x5c: string[];
};
