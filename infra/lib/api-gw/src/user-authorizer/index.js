"use strict";

const { CognitoJwtVerifier } = require("aws-jwt-verify");

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.CLIENT_ID,
});

const getAuthorizationResponse = (sub, methodArn) => {
  return {
    principalId: sub,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: methodArn,
        },
      ],
    },
  };
};

exports.handler = async (event) => {
  console.log(event);
  const accessToken = event.authorizationToken;
  console.log(accessToken);

  let payload;
  try {
    payload = await jwtVerifier.verify(accessToken);
    console.log("prosao");
  } catch {
    console.log("pao");
    throw Error("Unauthorized");
  }

  console.log(payload);

  if (payload["cognito:groups"].includes("RegularUsers") || payload["cognito:groups"].includes("Admins"))
    return getAuthorizationResponse(payload.sub, event.methodArn);

  throw Error("Unauthorized");
};
