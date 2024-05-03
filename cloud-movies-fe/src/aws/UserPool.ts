import { CognitoUserPool, ICognitoUserPoolData } from "amazon-cognito-identity-js";

const poolData: ICognitoUserPoolData = {
  UserPoolId: "eu-central-1_FWZCzP40G",
  ClientId: "2pst9rel5qlqm8tt9bqbleojj5",
};

export default new CognitoUserPool(poolData);
