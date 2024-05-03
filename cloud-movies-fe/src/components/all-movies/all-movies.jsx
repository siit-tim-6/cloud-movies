import Navbar from "@/components/navbar/navbar";
import "./all-movies.css";
import MovieCard from "./movie-card/movie-card";

function AllMovies() {
  return (
    <div className="all-movies">
      <Navbar />
      <div className="all-movies-grid">
        <MovieCard />
        <MovieCard />
        <MovieCard />
        <MovieCard />
        <MovieCard />
        <MovieCard />
        <MovieCard />
        <MovieCard />
        <MovieCard />
        <MovieCard />
        <MovieCard />
        <MovieCard />
        <MovieCard />
      </div>
    </div>
  );
}

export default AllMovies;
