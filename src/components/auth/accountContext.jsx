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

  return <AccountContext.Provider value={{ authenticate, getSession, logout }}>{props.children}</AccountContext.Provider>;
};

export { AccountProvider, AccountContext };
