import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/navbar/navbar.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import "./movie-details.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faHeart, faPlay, faTrash, faEdit, faTimes, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import Rating from "react-rating-stars-component";
import axios from "axios";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import ReactLoading from "react-loading";
import { AccountContext } from "../auth/accountContext";
import VideoPlayer from "../ui/hls-player";
import videojs from "video.js";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSession, getRole } = useContext(AccountContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState([]);
  const [actors, setActors] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [coverUrl, setCoverUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [role, setRole] = useState(undefined);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const getMovie = async () => {
      const session = await getSession();

      const movieResponse = await axios.get(`${import.meta.env.VITE_API_URL}/movies/${id}`);
      const subscriptionsReponse = await axios.get(`${import.meta.env.VITE_API_URL}/subscriptions`, {
        headers: {
          Authorization: session.accessToken.jwtToken,
        },
      });
      setTitle(movieResponse.data.Title);
      setGenres(movieResponse.data.Genres);
      setDescription(movieResponse.data.Description);
      setActors(movieResponse.data.Actors);
      setDirectors(movieResponse.data.Directors);
      setCoverUrl(movieResponse.data.CoverS3Url);
      setVideoUrl(movieResponse.data.VideoS3Url);
      setSubscriptions(subscriptionsReponse.data);
      setAverageRating(movieResponse.data.AverageRating || 0);
      console.log(subscriptionsReponse.data);
      const userRole = await getRole();
      setRole(userRole);

      setLoading(false);
    };

    getMovie();
  }, []);

  const handleRatingSubmit = async () => {
    const session = await getSession();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/rate-movie`,
        { movieId: id, rating: userRating },
        { headers: { Authorization: session.accessToken.jwtToken } }
      );

      setAverageRating(response.data.averageRating);
      setShowRatingModal(false);

      alert("Movie rated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error rating the movie:", error);
      alert("Failed to rate the movie.");
    }
  };

  const ratingChanged = (newRating) => {
    setUserRating(newRating);
  };

  const handleDownload = async () => {
    const session = await getSession();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/download-movie?movieId=${id}`, {
        headers: {
          Authorization: session.accessToken.jwtToken,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const downloadUrl = data.downloadUrl;

      if (!downloadUrl) {
        throw new Error("Download URL is undefined");
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "movie";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading the movie:", error);
      alert("Failed to download the movie.");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/movies/${id}`);
      alert("Movie deleted successfully!");
      navigate("/movies");
    } catch (error) {
      console.error("Error deleting the movie:", error);
      alert("Failed to delete the movie.");
    }
  };

  const confirmDelete = () => {
    confirmAlert({
      title: "Confirm to delete",
      message: "Are you sure you want to delete this movie?",
      buttons: [
        {
          label: "Yes",
          onClick: handleDelete,
        },
        {
          label: "No",
          onClick: () => {},
        },
      ],
    });
  };

  const subUnsubTo = async (type, value) => {
    const session = await getSession();
    const item = { type, value };
    console.log(item);

    try {
      if (subscriptions.some((sub) => sub.type === type && sub.value === value)) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/subscriptions?subscribedTo=${item.type}:${item.value}`, {
          headers: {
            Authorization: session.accessToken.jwtToken,
          },
        });
        setSubscriptions(subscriptions.filter((sub) => sub.type !== type || sub.value !== value));
        alert("Unsubscribed successfully.");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/subscriptions`,
          { subscribedTo: `${item.type}:${item.value}` },
          { headers: { Authorization: session.accessToken.jwtToken } }
        );
        setSubscriptions([...subscriptions, item]);
        alert("Subscribed successfully.");
      }
    } catch (error) {
      alert(`Failed to ${subscriptions.some((sub) => sub.type === type && sub.value === value) ? "un" : ""}subscribe.`);
    }
  };

  const videoSrc = `https://d3qd3s4bwsif3i.cloudfront.net/${id}/index.m3u8`;
  const playerRef = useRef(null);
  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: videoSrc,
        type: "application/x-mpegURL",
      },
    ],
  };
  const handlePlayerReady = (player) => {
    playerRef.current = player;

    // You can handle player events here, for example:
    player.on("waiting", () => {
      videojs.log("player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("player will dispose");
    });
  };

  return (
    <>
      <Navbar />
      <div className="movie-details-page">
        {loading ? (
          <div className="full-page">
            <ReactLoading type="spokes" color="#ffffff" height={100} width={100} />
          </div>
        ) : (
          <>
            {!isPlaying ? (
              <div className="movie-cover" style={{ backgroundImage: `url(${coverUrl})` }}>
                <div className="play-button" onClick={() => setIsPlaying(true)}>
                  <FontAwesomeIcon icon={faPlay} />
                </div>
              </div>
            ) : (
              <div className="video-player">
                <VideoPlayer className="video-element" options={videoJsOptions} onReady={handlePlayerReady} />
                <button className="close-button" onClick={() => setIsPlaying(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            )}
            <div className="movie-info">
              <div className="movie-title-favorite">
                <h1>{title}</h1>
                <button className="download-button" onClick={handleDownload}>
                  <FontAwesomeIcon icon={faDownload} />
                </button>
                {role === "ADMIN" ? (
                  <button className="edit-button" onClick={() => navigate(`/edit-movie/${id}`)}>
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                ) : null}
                {role === "ADMIN" ? (
                  <button className="delete-button" onClick={confirmDelete}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                ) : null}
                <button className="rate-button" onClick={() => setShowRatingModal(true)}>
                  <FontAwesomeIcon icon={faThumbsUp} />
                </button>
              </div>
              <div className="movie-genre-rating">
                {genres.map((genre, i) => (
                  <Badge key={i} className="movie-genre uppercased">
                    {genre}
                  </Badge>
                ))}
                <div className="rating">
                  <Rating count={5} value={averageRating} edit={false} size={24} activeColor="#ffd700" />
                  <span className="average-rating">({averageRating.toFixed(1)})</span>
                </div>
              </div>
              <p className="movie-description">{description}</p>
              <div className="movie-meta">
                <div className="meta-item">
                  <strong>Actors</strong>
                  {actors.map((actor, i) => (
                    <div key={i} className="data-line">
                      <p className="uppercased">{actor}</p>
                      <FontAwesomeIcon
                        className="icon-btn"
                        onClick={() => subUnsubTo("actor", actor)}
                        icon={faHeart}
                        color={subscriptions.some((sub) => sub.type === "actor" && sub.value === actor) ? "red" : "white"}
                      />
                    </div>
                  ))}
                </div>
                <div className="meta-item">
                  <strong>Directors</strong>
                  {directors.map((director, i) => (
                    <div key={i} className="data-line">
                      <p className="uppercased">{director}</p>
                      <FontAwesomeIcon
                        className="icon-btn"
                        onClick={() => subUnsubTo("director", director)}
                        icon={faHeart}
                        color={subscriptions.some((sub) => sub.type === "director" && sub.value === director) ? "red" : "white"}
                      />
                    </div>
                  ))}
                </div>
                <div className="meta-item">
                  <strong>Genres</strong>
                  <div className="data-list">
                    {genres.map((genre, i) => (
                      <div key={i} className="data-line">
                        <p className="uppercased">{genre}</p>
                        <FontAwesomeIcon
                          className="icon-btn"
                          onClick={() => subUnsubTo("genre", genre)}
                          icon={faHeart}
                          color={subscriptions.some((sub) => sub.type === "genre" && sub.value === genre) ? "red" : "white"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {showRatingModal && (
        <div className="custom-modal">
          <div className="custom-modal-content">
            <button className="close-modal-button" onClick={() => setShowRatingModal(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h2>Rate Movie</h2>
            <div className="rating-wrapper">
              <Rating count={5} value={userRating} onChange={ratingChanged} size={36} activeColor="#ffd700" />
            </div>
            <button className="submit-button" onClick={handleRatingSubmit}>
              Submit Rating
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default MovieDetails;
