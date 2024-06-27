import React, { useContext, useState } from "react";
import Navbar from "@/components/navbar/navbar.jsx";
import "./upload-movie.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AccountContext } from "../auth/accountContext";
import { Button } from "../ui/button";
import { MinusIcon, PlusIcon } from "@radix-ui/react-icons";

function UploadMovie() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState(null);
  const [video, setVideo] = useState(null);
  const [genreInputElems, setGenreInputElems] = useState([""]);
  const [actorInputElems, setActorInputElems] = useState([""]);
  const [directorInputElems, setDirectorInputElems] = useState([""]);

  const navigate = useNavigate();
  const { getSession } = useContext(AccountContext);

  const handleAddInput = (type) => {
    switch (type) {
      case "genre":
        setGenreInputElems([...genreInputElems, ""]);
        break;
      case "actor":
        setActorInputElems([...actorInputElems, ""]);
        break;
      case "director":
        setDirectorInputElems([...directorInputElems, ""]);
        break;
    }
  };

  const handleRemoveInput = (type, index) => {
    switch (type) {
      case "genre":
        const inputElCopy1 = [...genreInputElems];
        inputElCopy1.splice(index, 1);
        setGenreInputElems(inputElCopy1);
        break;
      case "actor":
        const inputElCopy2 = [...actorInputElems];
        inputElCopy2.splice(index, 1);
        setActorInputElems(inputElCopy2);
        break;
      case "director":
        const inputElCopy3 = [...directorInputElems];
        inputElCopy3.splice(index, 1);
        setDirectorInputElems(inputElCopy3);
        break;
    }
  };

  const handleChangeInput = (type, index, newVal) => {
    switch (type) {
      case "genre":
        const inputElCopy1 = [...genreInputElems];
        inputElCopy1[index] = newVal;
        setGenreInputElems(inputElCopy1);
        break;
      case "actor":
        const inputElCopy2 = [...actorInputElems];
        inputElCopy2[index] = newVal;
        setActorInputElems(inputElCopy2);
        break;
      case "director":
        const inputElCopy3 = [...directorInputElems];
        inputElCopy3[index] = newVal;
        setDirectorInputElems(inputElCopy3);
        break;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const session = await getSession();

    try {
      const metadataResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/movies`,
        {
          title,
          description,
          genres: genreInputElems,
          actors: actorInputElems,
          directors: directorInputElems,
          coverFileName: cover.name,
          coverFileType: cover.type,
          videoFileName: video.name,
          videoFileType: video.type,
        },
        {
          headers: {
            Authorization: session.accessToken.jwtToken,
          },
        }
      );

      const { coverUploadURL, videoUploadURL } = metadataResponse.data;
      console.log(coverUploadURL, videoUploadURL);

      // Upload the cover image to S3
      await axios.put(coverUploadURL, cover, {
        headers: {
          "Content-Type": cover.type,
        },
      });

      // Upload the video to S3
      await axios.put(videoUploadURL, video, {
        headers: {
          "Content-Type": video.type,
        },
      });

      alert("Movie uploaded successfully!");
      navigate("/movies");
    } catch (error) {
      console.error("Error uploading movie:", error);
      alert("Failed to upload movie.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="upload-movie-page">
        <h1 className="title">Upload Movie</h1>
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
            <label htmlFor="genre-0">Genre</label>
            {genreInputElems.map((_, i) => (
              <div key={`genre${i}`} className="input-line">
                <input
                  type="text"
                  id={`genre-${i}`}
                  value={genreInputElems[i]}
                  onChange={(e) => {
                    handleChangeInput("genre", i, e.target.value);
                  }}
                  required
                />
                <Button type="button">
                  {i !== genreInputElems.length - 1 ? (
                    <MinusIcon onClick={(e) => handleRemoveInput("genre", i)} />
                  ) : (
                    <PlusIcon onClick={() => handleAddInput("genre")} />
                  )}
                </Button>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label htmlFor="actor-0">Actors</label>
            {actorInputElems.map((_, i) => (
              <div key={`actor${i}`} className="input-line">
                <input type="text" id={`actor-${i}`} value={actorInputElems[i]} onChange={(e) => handleChangeInput("actor", i, e.target.value)} required />
                <Button type="button">
                  {i !== actorInputElems.length - 1 ? (
                    <MinusIcon onClick={(e) => handleRemoveInput("actor", i)} />
                  ) : (
                    <PlusIcon onClick={() => handleAddInput("actor")} />
                  )}
                </Button>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label htmlFor="director-0">Directors</label>
            {directorInputElems.map((_, i) => (
              <div key={`director${i}`} className="input-line">
                <input type="text" id={`director-${i}`} value={directorInputElems[i]} onChange={(e) => handleChangeInput("director", i, e.target.value)} required />
                <Button type="button">
                  {i !== directorInputElems.length - 1 ? (
                    <MinusIcon onClick={(e) => handleRemoveInput("director", i)} />
                  ) : (
                    <PlusIcon onClick={() => handleAddInput("director")} />
                  )}
                </Button>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label htmlFor="cover">Movie Cover</label>
            <div className="custom-file-input">
              <input type="file" id="cover" accept="image/*" onChange={(e) => setCover(e.target.files[0])} required />
              <span>Choose Cover Image</span>
            </div>
            {cover && <img src={URL.createObjectURL(cover)} alt="Movie Cover" className="cover-preview" />}
          </div>
          <div className="form-group">
            <label htmlFor="video">Movie File (MP4)</label>
            <div className="custom-file-input">
              <input type="file" id="video" accept="video/mp4" onChange={(e) => setVideo(e.target.files[0])} required />
              <span>Choose MP4 File</span>
            </div>
            {video && <video src={URL.createObjectURL(video)} controls className="video-preview"></video>}
          </div>
          <button type="submit" className="submit-button">
            Upload Movie
          </button>
        </form>
      </div>
    </>
  );
}

export default UploadMovie;
