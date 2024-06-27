import axios from "axios";
import { AccountContext } from "../auth/accountContext";
import Navbar from "../navbar/navbar";
import { Button } from "../ui/button";
import "./subscription-list.css";
import React, { useContext, useEffect, useState } from "react";
import ReactLoading from "react-loading";

function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState([]);
  const { getSession } = useContext(AccountContext);

  useEffect(() => {
    const getAllSubscriptions = async () => {
      const session = await getSession();

      const subscriptionsReponse = await axios.get(`${import.meta.env.VITE_API_URL}/subscriptions`, {
        headers: {
          Authorization: session.accessToken.jwtToken,
        },
      });

      setSubscriptions(subscriptionsReponse.data);
      setLoading(false);
    };

    getAllSubscriptions();
  }, []);

  const unsubscribe = async (item) => {
    const session = await getSession();

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/subscriptions?subscribedTo=${item}`, {
        headers: {
          Authorization: session.accessToken.jwtToken,
        },
      });
      setSubscriptions(subscriptions.filter((subscription) => subscription !== item));
      alert("Unsubscribed sucessfully.");
    } catch (error) {
      alert("Failed to unsubscribe.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="subscription-list">
        {loading ? (
          <div className="full-page">
            <ReactLoading type="spokes" color="#ffffff" height={100} width={100} />
          </div>
        ) : (
          <>
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3">Your Subscriptions</h3>
            {subscriptions.map((subscription) => (
              <div className="subscription-line">
                <p>{subscription}</p>
                <Button onClick={() => unsubscribe(subscription)}>Unsubscribe</Button>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

export default SubscriptionList;