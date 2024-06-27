"use strict";

const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } = require("@aws-sdk/client-cognito-identity-provider");

exports.addToUserGroup = async (event, context, callback) => {
  const client = new CognitoIdentityProviderClient();
  const params = {
    GroupName: "RegularUsers",
    UserPoolId: event.userPoolId,
    Username: event.userName,
  };

  if (!(event.request.userAttributes["cognito:user_status"] === "CONFIRMED" && event.request.userAttributes.email_verified === "true")) {
    callback("User was not properly confirmed and/or email not verified");
  }

  try {
    const command = new AdminAddUserToGroupCommand(params);
    const response = await client.send(command);

    callback(null, event);
  } catch (err) {
    callback(err);
  }
};
