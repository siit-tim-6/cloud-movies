import Navbar from "@/components/navbar/navbar";
import "./all-movies.css";
import MovieCard from "./movie-card/movie-card";
import MovieSearch from "./movie-search/movie-search";

function AllMovies() {
  return (
    <div className="all-movies">
      <Navbar />
      <div className="all-movies-content">
        <MovieSearch />
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
    </div>
  );
}

export default AllMovies;
