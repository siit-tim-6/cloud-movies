import React, { useEffect, useState } from "react";
import {useNavigate, useParams} from "react-router-dom";
import Navbar from "@/components/navbar/navbar.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import MovieCover from "@/assets/movie-placeholder.webp";
import "./movie-details.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faDownload, faEdit, faHeart, faPlay, faTrash} from "@fortawesome/free-solid-svg-icons";
import Rating from "react-rating-stars-component";
import axios from "axios";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(4);
  const [liked, setLiked] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [actors, setActors] = useState("");
  const [directors, setDirectors] = useState("");


  useEffect(() => {
    const getMovie = async () => {
      const movieResponse = await axios.get(`${import.meta.env.VITE_API_URL}/movies/${id}`);
      setTitle(movieResponse.data.Title);
      setGenre(movieResponse.data.Genre);
      setDescription(movieResponse.data.Description);
      setActors(movieResponse.data.Actors);
      setDirectors(movieResponse.data.Directors);
    }

    getMovie();
  }, [])
  

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
      navigate('/movies');
    } catch (error) {
      console.error("Error deleting the movie:", error);
      alert("Failed to delete the movie.");
    }
  };

  const confirmDelete = () => {
    confirmAlert({
      title: 'Confirm to delete',
      message: 'Are you sure you want to delete this movie?',
      buttons: [
        {
          label: 'Yes',
          onClick: handleDelete
        },
        {
          label: 'No',
          onClick: () => {}
        }
      ]
    });
  };

  const handleEdit = () => {
    navigate(`/edit-movie/${id}`);
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
            <h1>{title}</h1>
            <button className="favorite-button" onClick={toggleLike}>
              <FontAwesomeIcon icon={faHeart} color={liked ? "red" : "white"}/>
            </button>
            <button className="download-button" onClick={handleDownload}>
              <FontAwesomeIcon icon={faDownload}/>
            </button>
            <button className="delete-button" onClick={confirmDelete}>
              <FontAwesomeIcon icon={faTrash}/>
            </button>
            <button className="edit-button" onClick={handleEdit}>
              <FontAwesomeIcon icon={faEdit}/>
            </button>
          </div>
          <div className="movie-genre-rating">
            <Badge className="movie-genre">{genre}</Badge>
            <div className="rating">
              <Rating count={5} value={rating} edit={false} size={24} activeColor="#ffd700" />
            </div>
          </div>
          <p className="movie-description">
            {description}
          </p>
          <div className="movie-meta">
            <div className="meta-item">
              <strong>Actors:</strong> {actors}
            </div>
            <div className="meta-item">
              <strong>Directors:</strong> {directors}
            </div>
            <div className="meta-item">
              <strong>Genres:</strong> {genre}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MovieDetails;
