import { Button } from "@/components/ui/button";
import "./home-movie.css";
import { PlayIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

function HomeMovie({ movie }) {
  const genres = movie.Genres || [];

  return (
      <div className="home-movie" style={{ backgroundImage: `url(${movie.CoverS3Url})` }}>
        <div className="movie-details">
          {genres.map((genre, i) => (
              <Badge key={i} className="text-lg px-4 py-1 rounded-full font-medium">{genre}</Badge>
          ))}
          <h1>{movie.Title}</h1>
          <p>{movie.Description}</p>
          <div className="details-buttons">
              <Link to={`/movies/${movie.MovieId}`}>
                  <Button className="text-lg py-8 px-10 rounded-full font-medium" style={{ backgroundColor: 'white', color: 'black' }}>
                      Watch <ArrowRightIcon className="ml-2"/>
                  </Button>
              </Link>
          </div>
        </div>
      </div>
  );
}

export default HomeMovie;
