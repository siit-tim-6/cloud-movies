import Navbar from "@/components/navbar/navbar";
import "./all-movies.css";
import MovieCard from "./movie-card/movie-card";
import MovieSearch from "./movie-search/movie-search";
import { useEffect, useState } from "react";
import axios from "axios";
import ReactLoading from "react-loading";

function AllMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAllMovies = async () => {
      const moviesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/movies`);
      setMovies(moviesResponse.data);
      setLoading(false);
    };

    getAllMovies();
  }, []);

  return (
    <div className="all-movies">
      <Navbar />
      <div className="all-movies-content">
        <MovieSearch setMovies={setMovies} setLoading={setLoading} />
        {loading ? (
          <div className="full-page-80" style={{ marginLeft: "20vw" }}>
            <ReactLoading type="spokes" color="#ffffff" height={100} width={100} />
          </div>
        ) : (
          <div className="all-movies-grid">
            {movies.map((movie) => (
              <MovieCard Genre={movie.Genres[0]} MovieId={movie.MovieId} Title={movie.Title} CoverS3Url={movie.CoverS3Url} key={movie.MovieId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AllMovies;
