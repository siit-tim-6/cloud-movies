import Navbar from "@/components/navbar/navbar";
import "./all-movies.css";
import MovieCard from "./movie-card/movie-card";
import MovieSearch from "./movie-search/movie-search";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import ReactLoading from "react-loading";
import { AccountContext } from "@/components/auth/accountContext.jsx";

function AllMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getSession } = useContext(AccountContext);

  useEffect(() => {
    const getAllMovies = async () => {
      const session = await getSession();
      const moviesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/movies`, {
        headers: {
          Authorization: session.accessToken.jwtToken,
        },
      });

      const groupedData = moviesResponse.data.reduce((acc, item) => {
        const groupKey = item.Title;
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
      }, {});

      // console.log(Object.entries(groupedData).forEach((key, value)));
      setMovies(groupedData);

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
            {Object.entries(movies).map(([key, movie]) => (
              <MovieCard
                Genre={movie[0].Genres[0]}
                MovieId={movie[0].MovieId}
                Title={movie[0].Title}
                CoverS3Url={movie[0].CoverS3Url}
                Series={movie.length > 1}
                key={movie[0].MovieId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AllMovies;
