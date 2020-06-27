# About the repository

This is the sample code that

# Verifying an RS232 signed JWT

JSON Web Tokens (JWT) are used as a way to verify the identity of the caller of an API.
**The best way to verify a JWT is to use a verification library.**
I wanted to have a look at some of what those libraries are doing under the hood by putting together a function that will return if a given token is valid. In this blog I'll go through what I have done to get a validation function working.

To simplify things assume:

- That the signing algorithm is RS232 all others are considered invalid.
- That the public keys are available on a JWKS url provided to the function eg [https://klee-test.au.auth0.com/.well-known/jwks.json](https://klee-test.au.auth0.com/.well-known/jwks.json)
- I only want to know if the token was signed by a key available at the above url. I wont be checking if the token has expired, if the scopes or other claims are valid.

# Break up the token

A JWT is made up to 3 parts. The first thing to do in validating the token is to break this apart.

- The header - Meta information about the token. This is a JSON string tha has been base 64 encoded.
- The Body - Claims that the token is asserting. This is a JSON string tha has been base 64 encoded.
- The Signature - Used to verify the integrity of the token.

The token string is made up of the three sections concatenated with a `.` character. The first thing to do is to split the 3 sections.

```Typescript
  const [rawHead, rawBody, signature] = jwt.split(".");
```

# Check the Algorithm

To check the token has been signed with the expected algorithm the head needs to be readable.

Create a way to decode the base 64 encode string into TypeScript objects.

```TypeScript
function decodeAndJsonParse<T>(base64: string): T {
  // Decode the JSON string from Base 64
  const json = new Buffer(base64, "base64").toString("ascii");
  // Return the parsed object
  return JSON.parse(json);
}
```

Read the head section of the JWT into a known type `{ alg: string; kid: string }`.

```Typescript
  const parsedHead = decodeAndJsonParse<{ alg: string; kid: string }>(rawHead);
```

Check that the `alg` property is the algorithm that was used to sign the token. This example is only going to support the `RS256` signing method. If the algorithm is anything else reject the key.

```Typescript
  if (parsedHead.alg !== "RS256") {
    return false;
  }
```

# Get the key

The next step in validating that the token was signed with a known private key is to fetch the public key. The standard for sharing these are to provide a JSON Web Key Set (JWKS) endpoint. The return value from this endpoint for RS256 keys matches this type definition:

## Set up a TypeScript type for the key

```Typescript
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

```

Important properties for this example are:
`alg`: The Algorithm that was used to sign the key.
`n`: The public key modulus (Base64urlUInt encoded)
`e`: The public key exponent. (Base64urlUInt-encoded)
`kid`: The key identifier.
The spec that outlines the use of all the parameters can be found in [RFC7518](https://tools.ietf.org/html/rfc7518#section-6.3.1);

## Fetch the key

Use `node-fetch` to get the JWKS keys from the provided endpoint.

```Typescript
  // Get the key
  const jwksResponse = await fetch(jwksEndpoint);
  // Read the JSON response as a JWKS type
  const jwks: JWKS = await jwksResponse.json() as JWKS;
```

## Check the key

Check that there is a key in the set with a `kid` that matches the `kid` from the tokens head.

```Typescript
  // Find the key that matches the token
  const jwk = jwks.keys.find((key) => key.kid === parsedHead.kid);

  // Check that a key was found and that it's the correct algorithm
  if (!jwk || jwk.alg !== "RS256") {
    return false;
  }
```

## Convert the JWK to pem

The JWK is a JSON object that contains the components of the public key. To validate the JWT the components need to be converted into a PEM format key.
To do this pass the `n` and `e` parameters of the JWK to [NodeRSA](https://github.com/rzcoder/node-rsa) with the `"components-public"` flag. Then export the key into a PEM key string.

```TypeScript
  // Make an instance of Node RSA from the JWK public key components
  const key = new NodeRSA(
    {
      n: Buffer.from(jwk.n),
      e: Buffer.from(jwk.e),
    },
    "components-public"
  );
  // Export the key into the desired formats
  const pem = key.exportKey("pkcs8-public-pem");
```

# Use Crypto to verify the token

Node provides a built in Crypto library that can be used to validate the token.

## Setup the Crypto verify object

Start by creating an instance of the Verify class from the Crypto package by using the `createVerify` factory method with the `"RSA-SHA256"` to specify the algorithm to use.

```Typescript
  // Create a verify object that can be used to verify the token
  const verifyObject = Crypto.createVerify("RSA-SHA256");
```

## Add the token head and body to the verify object.

The verify object can be written to as a stream. Write in the head and the body section of the JWT with a `"."` in the middle. Effectively taking the JWT without the signature.

```Typescript
  // Write the base64 encoded head the . character and the base64 encoded body to the stream.
  verifyObject.write(rawHead + "." + rawBody);
  // Close the stream
  verifyObject.end();
```

## Normalise the base64 signature

**This is the tricky part.** The signature is Base64URL encoded but it needs to be Base64 encoded. Node is able to take care of this by passing it in and out of a buffer. If this isn't done the signature will **always** be invalid.

```Typescript
  // Important! Normalise the base64 encoding by reading the signature in and writing it out.
  const base64Signature = Buffer.from(signature, "base64").toString("base64");
```

## Validate the signature

The final step is to use the `verifyObject` to validate that the JWT's signature was created using the private key that is paired with the public key retrieved from the JWKS endpoint.

This is done by passing the PEM formatted public key, the signature and the format into the `verify` method on the `verifyObject`

```Typescript
  // validate that the signature is correct.
  const signatureIsValid = verifyObject.verify(pem, base64Signature, "base64");
```

# Don't do this

There are lots of great libraries available to validate tokens, take care of formatting issues and they are probably more reliable and robust than what I've put together here. If you're looking for a library to use try the listing on [jwt.io](https://jwt.io/).

---

Code for this blog can be found on [my GitHub](https://github.com/KleeUT/TypescriptJWTValidator)

---

Cover image from [unsplash](https://unsplash.com/photos/C3rK5toz0qA)
