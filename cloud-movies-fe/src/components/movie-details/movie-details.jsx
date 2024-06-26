import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/navbar/navbar.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import MovieCover from "@/assets/movie-placeholder.webp";
import "./movie-details.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faHeart, faPlay, faTrash } from "@fortawesome/free-solid-svg-icons";
import Rating from "react-rating-stars-component";
import axios from "axios";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { Button } from "../ui/button";
import ReactLoading from "react-loading";
import { AccountContext } from "../auth/accountContext";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSession } = useContext(AccountContext);

  const [rating, setRating] = useState(4);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState([]);
  const [actors, setActors] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMovie = async () => {
      const movieResponse = await axios.get(`${import.meta.env.VITE_API_URL}/movies/${id}`);
      setTitle(movieResponse.data.Title);
      setGenres(movieResponse.data.Genres);
      setDescription(movieResponse.data.Description);
      setActors(movieResponse.data.Actors);
      setDirectors(movieResponse.data.Directors);
      setCoverUrl(movieResponse.data.CoverS3Url);
      setLoading(false);
    };

    getMovie();
  }, []);

  const ratingChanged = (newRating) => {
    setRating(newRating);
  };

  const toggleLike = () => {
    setLiked(!liked);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/download-movie?movieId=${id}`);

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

  const subscribeTo = async (item) => {
    const session = await getSession();

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/subscribe`,
        {
          subscribedTo: item,
        },
        {
          headers: {
            Authorization: session.accessToken.jwtToken,
          },
        }
      );

      alert("Subscribed sucessfully.");
    } catch (error) {
      alert("Failed to subscribe.");
    }
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
            <div className="movie-cover" style={{ backgroundImage: `url(${coverUrl})` }}>
              <div className="play-button">
                <FontAwesomeIcon icon={faPlay} />
              </div>
            </div>
            <div className="movie-info">
              <div className="movie-title-favorite">
                <h1>{title}</h1>
                <button className="download-button" onClick={handleDownload}>
                  <FontAwesomeIcon icon={faDownload} />
                </button>
                <button className="delete-button" onClick={confirmDelete}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              <div className="movie-genre-rating">
                {genres.map((genre) => (
                  <Badge className="movie-genre">{genre}</Badge>
                ))}
                <div className="rating">
                  <Rating count={5} value={rating} edit={false} size={24} activeColor="#ffd700" />
                </div>
              </div>
              <p className="movie-description">{description}</p>
              <div className="movie-meta">
                <div className="meta-item">
                  <strong>Actors</strong>
                  {actors.map((actor) => (
                    <div className="data-line">
                      <p>{actor}</p>
                      <FontAwesomeIcon className="icon-btn" onClick={() => subscribeTo(actor)} icon={faHeart} />
                    </div>
                  ))}
                </div>
                <div className="meta-item">
                  <strong>Directors</strong>
                  {directors.map((director) => (
                    <div className="data-line">
                      <p>{director}</p>
                      <FontAwesomeIcon className="icon-btn" onClick={() => subscribeTo(director)} icon={faHeart} />
                    </div>
                  ))}
                </div>
                <div className="meta-item">
                  <strong>Genres</strong>
                  <div className="data-list">
                    {genres.map((genre) => (
                      <div className="data-line">
                        <p>{genre}</p>
                        <FontAwesomeIcon className="icon-btn" onClick={() => subscribeTo(genre)} icon={faHeart} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default MovieDetails;
