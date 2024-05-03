import { CognitoUserPool, ICognitoUserPoolData } from "amazon-cognito-identity-js";

const poolData: ICognitoUserPoolData = {
  UserPoolId: "eu-central-1_2I4RSC0Q8",
  ClientId: "a2e3jp2fnq0000kikvvvhqhpb",
};

export default new CognitoUserPool(poolData);
