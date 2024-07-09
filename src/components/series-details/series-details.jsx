import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/navbar/navbar.jsx";
import "./series-details.css";
import axios from "axios";
import "react-confirm-alert/src/react-confirm-alert.css";
import ReactLoading from "react-loading";
import { AccountContext } from "../auth/accountContext";

function SeriesDetails() {
  const { title } = useParams();
  const navigate = useNavigate();
  const { getSession } = useContext(AccountContext);

  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSeries = async () => {
      const session = await getSession();
      let query = `title=${title}&description=&actor=&director=&genre=`;
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/movies?${query}`, {
        headers: {
          Authorization: session.accessToken.jwtToken,
        },
      });

      if (response.data.length === 0) {
        alert("Series not found");
        navigate("/movies");
      }

      setEpisodes(response.data);
      setLoading(false);
    };

    getSeries();
  }, []);

  return (
    <>
      <Navbar />
      <div className="series-details-page">
        {loading ? (
          <div className="full-page">
            <ReactLoading type="spokes" color="#ffffff" height={100} width={100} />
          </div>
        ) : (
          <>
            <h3 className="text-white scroll-m-20 text-2xl font-semibold tracking-tight mb-5">Episode List</h3>
            <div className="series-info">
              {episodes.map((episode) => (
                <Link to={`/movies/${episode.MovieId}`}>
                  <p>{episode.EpisodeTitle}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default SeriesDetails;
