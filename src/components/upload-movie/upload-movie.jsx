import React, { useContext, useEffect, useState } from "react";
import Navbar from "@/components/navbar/navbar.jsx";
import "./upload-movie.css";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { AccountContext } from "../auth/accountContext";
import { Button } from "../ui/button";
import { MinusIcon, PlusIcon } from "@radix-ui/react-icons";

function UploadMovie({ isEditMode = false }) {
  const [movieDetails, setMovieDetails] = useState({
    title: "",
    description: "",
    genres: [""],
    actors: [""],
    directors: [""],
    coverFileName: "",
    coverFileType: "",
    videoFileName: "",
    videoFileType: "",
    coverS3Url: "",
    videoS3Url: ""
  });

  const [cover, setCover] = useState(null);
  const [video, setVideo] = useState(null);

  const navigate = useNavigate();
  const { getSession } = useContext(AccountContext);
  const { id } = useParams();

  useEffect(() => {
    if (isEditMode) {
      fetchMovieDetails().then(() => {
        console.log("State after fetching movie details:", movieDetails);
      });
    }
  }, [isEditMode, id]);

  const fetchMovieDetails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/movies/${id}`);
      const movie = response.data;
      console.log("Fetched movie details:", movie);

      const coverFileName = movie.CoverS3Url.split('/').pop();
      const videoFileName = movie.VideoS3Url.split('/').pop();
      const coverFileType = inferFileType(coverFileName);
      const videoFileType = inferFileType(videoFileName);

      setMovieDetails({
        title: movie.Title || "",
        description: movie.Description || "",
        genres: movie.Genres || [""],
        actors: movie.Actors || [""],
        directors: movie.Directors || [""],
        coverFileName: coverFileName || "",
        coverFileType: coverFileType || "",
        videoFileName: videoFileName || "",
        videoFileType: videoFileType || "",
        coverS3Url: movie.CoverS3Url || "",
        videoS3Url: movie.VideoS3Url || ""
      });
    } catch (error) {
      console.error("Error fetching movie details:", error);
    }
  };

  const inferFileType = (fileName) => {
    const extension = fileName.split('.').pop();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'mp4':
        return 'video/mp4';
      default:
        return '';
    }
  };

  const handleAddInput = (type) => {
    setMovieDetails((prevDetails) => ({
      ...prevDetails,
      [type]: [...prevDetails[type], ""],
    }));
  };

  const handleRemoveInput = (type, index) => {
    setMovieDetails((prevDetails) => ({
      ...prevDetails,
      [type]: prevDetails[type].filter((_, i) => i !== index),
    }));
  };

  const handleChangeInput = (type, index, newVal) => {
    setMovieDetails((prevDetails) => ({
      ...prevDetails,
      [type]: prevDetails[type].map((val, i) => (i === index ? newVal : val)),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const session = await getSession();
    let apiUrl = ""

    if (isEditMode) {
      apiUrl = `${import.meta.env.VITE_API_URL}/movies/${id}`;
    } else {
      apiUrl = `${import.meta.env.VITE_API_URL}/movies`;
    }

    try {
      const metadataResponse = await axios({
        method: isEditMode ? "put" : "post",
        url: apiUrl,
        data: {
          title: movieDetails.title,
          description: movieDetails.description,
          genres: movieDetails.genres,
          actors: movieDetails.actors,
          directors: movieDetails.directors,
          coverFileName: cover ? cover.name : movieDetails.coverFileName,
          coverFileType: cover ? cover.type : movieDetails.coverFileType,
          videoFileName: video ? video.name : movieDetails.videoFileName,
          videoFileType: video ? video.type : movieDetails.videoFileType,
        },
        headers: {
          Authorization: session.accessToken.jwtToken,
        },
      });

      const { coverUploadURL, videoUploadURL } = metadataResponse.data;

      if (cover && coverUploadURL) {
        await axios.put(coverUploadURL, cover, {
          headers: {
            "Content-Type": cover.type,
          },
        });
      }

      if (video && videoUploadURL) {
        await axios.put(videoUploadURL, video, {
          headers: {
            "Content-Type": video.type,
          },
        });
      }

      alert(`Movie ${isEditMode ? "updated" : "uploaded"} successfully!`);
      navigate("/movies");
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "uploading"} movie:`, error);
      alert(`Failed to ${isEditMode ? "update" : "upload"} movie.`);
    }
  };

  return (
      <>
        <Navbar />
        <div className="upload-movie-page">
          <h1 className="title">{isEditMode ? "Edit" : "Upload"} Movie</h1>
          <form className="upload-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input type="text" id="title" value={movieDetails.title} onChange={(e) => setMovieDetails({ ...movieDetails, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" value={movieDetails.description} onChange={(e) => setMovieDetails({ ...movieDetails, description: e.target.value })} required></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="genre-0">Genre</label>
              {movieDetails.genres.map((genre, i) => (
                  <div key={`genre${i}`} className="input-line">
                    <input
                        type="text"
                        id={`genre-${i}`}
                        value={genre}
                        onChange={(e) => handleChangeInput("genres", i, e.target.value)}
                        required
                    />
                    <Button type="button">
                      {i !== movieDetails.genres.length - 1 ? (
                          <MinusIcon onClick={() => handleRemoveInput("genres", i)} />
                      ) : (
                          <PlusIcon onClick={() => handleAddInput("genres")} />
                      )}
                    </Button>
                  </div>
              ))}
            </div>
            <div className="form-group">
              <label htmlFor="actor-0">Actors</label>
              {movieDetails.actors.map((actor, i) => (
                  <div key={`actor${i}`} className="input-line">
                    <input
                        type="text"
                        id={`actor-${i}`}
                        value={actor}
                        onChange={(e) => handleChangeInput("actors", i, e.target.value)}
                        required
                    />
                    <Button type="button">
                      {i !== movieDetails.actors.length - 1 ? (
                          <MinusIcon onClick={() => handleRemoveInput("actors", i)} />
                      ) : (
                          <PlusIcon onClick={() => handleAddInput("actors")} />
                      )}
                    </Button>
                  </div>
              ))}
            </div>
            <div className="form-group">
              <label htmlFor="director-0">Directors</label>
              {movieDetails.directors.map((director, i) => (
                  <div key={`director${i}`} className="input-line">
                    <input
                        type="text"
                        id={`director-${i}`}
                        value={director}
                        onChange={(e) => handleChangeInput("directors", i, e.target.value)}
                        required
                    />
                    <Button type="button">
                      {i !== movieDetails.directors.length - 1 ? (
                          <MinusIcon onClick={() => handleRemoveInput("directors", i)} />
                      ) : (
                          <PlusIcon onClick={() => handleAddInput("directors")} />
                      )}
                    </Button>
                  </div>
              ))}
            </div>
            <div className="form-group">
              <label htmlFor="cover">Movie Cover</label>
              <div className="custom-file-input">
                <input type="file" id="cover" accept="image/*" onChange={(e) => setCover(e.target.files[0])} />
                <span>Choose Cover Image</span>
              </div>
              {movieDetails.coverS3Url && !cover && (
                  <img src={movieDetails.coverS3Url} alt="Movie Cover" className="cover-preview" />
              )}
              {cover && <img src={URL.createObjectURL(cover)} alt="Movie Cover" className="cover-preview" />}
            </div>
            <div className="form-group">
              <label htmlFor="video">Movie File (MP4)</label>
              <div className="custom-file-input">
                <input type="file" id="video" accept="video/mp4" onChange={(e) => setVideo(e.target.files[0])} />
                <span>Choose MP4 File</span>
              </div>
              {movieDetails.videoS3Url && !video && (
                  <video src={movieDetails.videoS3Url} controls className="video-preview"></video>
              )}
              {video && <video src={URL.createObjectURL(video)} controls className="video-preview"></video>}
            </div>
            <button type="submit" className="submit-button">
              {isEditMode ? "Update" : "Upload"} Movie
            </button>
          </form>
        </div>
      </>
  );
}

export default UploadMovie;