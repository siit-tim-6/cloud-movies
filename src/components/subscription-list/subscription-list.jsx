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
      await axios.delete(`${import.meta.env.VITE_API_URL}/subscriptions?subscribedTo=${item.type}:${item.value}`, {
        headers: {
          Authorization: session.accessToken.jwtToken,
        },
      });
      setSubscriptions(subscriptions.filter(sub => sub.type !== item.type || sub.value !== item.value));
      alert("Unsubscribed successfully.");
    } catch (error) {
      if (error.response.status === 412)
        alert("Failed to unsubscribe. Please confirm the unsubscription in your email.");
      else
        alert("Failed to unsubscribe.");
    }
  };

  const renderSubscriptionsByType = (type) => {
    return subscriptions
        .filter((sub) => sub.type === type)
        .map((sub) => (
            <div className="subscription-line" key={sub.value}>
              <p className="capitalized">{sub.value}</p>
              <Button onClick={() => unsubscribe(sub)}>Unsubscribe</Button>
            </div>
        ));
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
              <div>
                <h4 className="text-xl font-semibold">Genres</h4>
                {renderSubscriptionsByType("genre")}
              </div>
              <div>
                <h4 className="text-xl font-semibold">Actors</h4>
                {renderSubscriptionsByType("actor")}
              </div>
              <div>
                <h4 className="text-xl font-semibold">Directors</h4>
                {renderSubscriptionsByType("director")}
              </div>
            </>
        )}
      </div>
    </>
  );
}

export default SubscriptionList;
