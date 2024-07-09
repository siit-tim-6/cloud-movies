import UserPool from "@/aws/UserPool";
import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { createContext } from "react";

const AccountContext = createContext();

const AccountProvider = (props) => {
  const getSession = async () => {
    return new Promise((resolve, reject) => {
      const user = UserPool.getCurrentUser();

      if (user) {
        user.getSession((err, session) => {
          if (err) {
            reject();
          } else {
            resolve(session);
          }
        });
      } else {
        reject();
      }
    });
  };

  const authenticate = async (username, password) => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: username,
        Pool: UserPool,
      });

      const authDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      user.authenticateUser(authDetails, {
        onSuccess: (data) => {
          resolve(data);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  };

  const logout = () => {
    const user = UserPool.getCurrentUser();

    if (user) {
      user.signOut();
    }
  };

  const getRole = async () => {
    const session = await getSession();
    const jwtToken = session.accessToken.jwtToken;

    const base64Url = jwtToken.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const jsonData = JSON.parse(jsonPayload);

    if (jsonData["cognito:groups"].includes("Admins")) return "ADMIN";
    else if (jsonData["cognito:groups"].includes("RegularUsers")) return "USER";
    return undefined;
  };

  return <AccountContext.Provider value={{ authenticate, getSession, logout, getRole }}>{props.children}</AccountContext.Provider>;
};

export { AccountProvider, AccountContext };
