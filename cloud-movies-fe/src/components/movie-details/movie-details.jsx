import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/navbar/navbar.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import MovieCover from "@/assets/movie-placeholder.webp";
import "./movie-details.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faHeart, faPlay } from "@fortawesome/free-solid-svg-icons";
import Rating from "react-rating-stars-component";

function MovieDetails() {
  const { id } = useParams();

  const [rating, setRating] = useState(4);
  const [liked, setLiked] = useState(false);

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

  return (
    <>
      <Navbar />
      <div className="movie-details-page">
        <div className="movie-cover" style={{ backgroundImage: `url(${MovieCover})` }}>
          <div className="play-button">
            <FontAwesomeIcon icon={faPlay} />
          </div>
        </div>
        <div className="movie-info">
          <div className="movie-title-favorite">
            <h1>Star Wars</h1>
            <button className="favorite-button" onClick={toggleLike}>
              <FontAwesomeIcon icon={faHeart} color={liked ? "red" : "white"} />
            </button>
            <button className="download-button" onClick={handleDownload}>
              <FontAwesomeIcon icon={faDownload} />
            </button>
          </div>
          <div className="movie-genre-rating">
            <Badge className="movie-genre">Sci-Fi</Badge>
            <div className="rating">
              <Rating count={5} value={rating} edit={false} size={24} activeColor="#ffd700" />
            </div>
          </div>
          <p className="movie-description">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit iure minus rerum et qui ipsam, cum error beatae numquam vero voluptates illum accusamus
            officia officiis! Distinctio nulla necessitatibus veniam fuga.
          </p>
          <div className="movie-meta">
            <div className="meta-item">
              <strong>Actors:</strong> Mark Hamill, Harrison Ford, Carrie Fisher
            </div>
            <div className="meta-item">
              <strong>Directors:</strong> George Lucas
            </div>
            <div className="meta-item">
              <strong>Genres:</strong> Sci-Fi, Adventure, Fantasy
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MovieDetails;
