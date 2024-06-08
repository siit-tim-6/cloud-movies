import React, { useState } from "react";
import Navbar from "@/components/navbar/navbar.jsx";
import "./upload-movie.css";

function UploadMovie() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [genre, setGenre] = useState("");
    const [actors, setActors] = useState("");
    const [directors, setDirectors] = useState("");
    const [cover, setCover] = useState(null);

    const handleCoverUpload = (event) => {
        setCover(URL.createObjectURL(event.target.files[0]));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Upload not implemented yet");
    };

    return (
        <>
            <Navbar />
            <div className="upload-movie-page">
                <h1 className="title">Upload Movie</h1>
                <form className="upload-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="genre">Genre</label>
                        <input
                            type="text"
                            id="genre"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="actors">Actors</label>
                        <input
                            type="text"
                            id="actors"
                            value={actors}
                            onChange={(e) => setActors(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="directors">Directors</label>
                        <input
                            type="text"
                            id="directors"
                            value={directors}
                            onChange={(e) => setDirectors(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="cover">Movie Cover</label>
                        <input
                            type="file"
                            id="cover"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            required
                        />
                        {cover && <img src={cover} alt="Movie Cover" className="cover-preview" />}
                    </div>
                    <button type="submit" className="submit-button">Upload Movie</button>
                </form>
            </div>
        </>
    );
}

export default UploadMovie;

