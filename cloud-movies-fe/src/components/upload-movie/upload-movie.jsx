import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar/navbar.jsx";
import "./upload-movie.css";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function UploadMovie({ isEditMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [actors, setActors] = useState("");
  const [directors, setDirectors] = useState("");
  const [cover, setCover] = useState(null);
  const [video, setVideo] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      const getMovie = async () => {
        const movieResponse = await axios.get(`${import.meta.env.VITE_API_URL}/movies/${id}`);
        setTitle(movieResponse.data.Title);
        setDescription(movieResponse.data.Description);
        setGenre(movieResponse.data.Genre);
        setActors(movieResponse.data.Actors);
        setDirectors(movieResponse.data.Directors);
        setCover(movieResponse.data.CoverS3Url);
        setVideo(movieResponse.data.VideoS3Url);
      };

      getMovie();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        title,
        description,
        genre,
        actors,
        directors,
        coverFileName: cover ? cover.name : undefined,
        coverFileType: cover ? cover.type : undefined,
        videoFileName: video ? video.name : undefined,
        videoFileType: video ? video.type : undefined,
      };

      console.log(cover.name)
      console.log(video)
      console.log(payload)

      let metadataResponse;

      if (isEditMode) {
        metadataResponse = await axios.put(`${import.meta.env.VITE_API_URL}/movies/${id}`, payload);
      } else {
        metadataResponse = await axios.post(`${import.meta.env.VITE_API_URL}/upload-movie`, payload);
      }

      const { coverUploadURL, videoUploadURL } = metadataResponse.data;

      if (cover) {
        await axios.put(coverUploadURL, cover, {
          headers: {
            "Content-Type": cover.type,
          },
        });
      }

      if (video) {
        await axios.put(videoUploadURL, video, {
          headers: {
            "Content-Type": video.type,
          },
        });
      }

      alert(`Movie ${isEditMode ? "updated" : "uploaded"} successfully!`);
      navigate('/movies');
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "uploading"} movie:`, error);
      alert(`Failed to ${isEditMode ? "update" : "upload"} movie.`);
    }
  };

  return (
      <>
        <Navbar />
        <div className="upload-movie-page">
          <h1 className="title">{isEditMode ? "Edit Movie" : "Upload Movie"}</h1>
          <form className="upload-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="genre">Genre</label>
              <input type="text" id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="actors">Actors</label>
              <input type="text" id="actors" value={actors} onChange={(e) => setActors(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="directors">Directors</label>
              <input type="text" id="directors" value={directors} onChange={(e) => setDirectors(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="cover">Movie Cover</label>
              <div className="custom-file-input">
                <input type="file" id="cover" accept="image/*" onChange={(e) => setCover(e.target.files[0])} />
                <span>Choose Cover Image</span>
              </div>
              {cover && (
                  typeof cover === 'string' ? (
                      <img src={cover} alt="Movie Cover" className="cover-preview" />
                  ) : (
                      <img src={URL.createObjectURL(cover)} alt="Movie Cover" className="cover-preview" />
                  )
              )}
            </div>
            <div className="form-group">
              <label htmlFor="video">Movie File (MP4)</label>
              <div className="custom-file-input">
                <input type="file" id="video" accept="video/mp4" onChange={(e) => setVideo(e.target.files[0])} />
                <span>Choose MP4 File</span>
              </div>
              {video && (
                  typeof video === 'string' ? (
                      <video src={video} controls className="video-preview"></video>
                  ) : (
                      <video src={URL.createObjectURL(video)} controls className="video-preview"></video>
                  )
              )}
            </div>
            <button type="submit" className="submit-button">
              {isEditMode ? "Update Movie" : "Upload Movie"}
            </button>
          </form>
        </div>
      </>
  );
}

export default UploadMovie;
