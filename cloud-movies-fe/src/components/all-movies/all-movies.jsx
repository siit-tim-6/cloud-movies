import Navbar from "@/components/navbar/navbar";
import "./all-movies.css";
import MovieCard from "./movie-card/movie-card";
import MovieSearch from "./movie-search/movie-search";
import { useEffect, useState } from "react";
import axios from "axios";

function AllMovies() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const getAllMovies = async () => {
      const moviesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/movies`);
      setMovies(moviesResponse.data);
    };

    getAllMovies();
  }, []);

  return (
    <div className="all-movies">
      <Navbar />
      <div className="all-movies-content">
        <MovieSearch setMovies={setMovies} />
        <div className="all-movies-grid">
          {movies.map((movie) => (
            <MovieCard Genre={movie.Genre} MovieId={movie.MovieId} Title={movie.Title} key={movie.MovieId} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AllMovies;
