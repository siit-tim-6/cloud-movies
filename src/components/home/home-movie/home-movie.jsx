import { Button } from "@/components/ui/button";
import "./home-movie.css";
import { PlayIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

function HomeMovie({ movie }) {
  const genres = movie.Genres?.L?.map((genre) => genre.S) || [];

  return (
      <div className="home-movie" style={{ backgroundImage: `url(${movie.CoverS3Url.S || MovieCover})` }}>
        <div className="movie-details">
          {genres.map((genre, i) => (
              <Badge key={i} className="text-lg px-4 py-1 rounded-full font-medium">{genre}</Badge>
          ))}
          <h1>{movie.Title.S}</h1>
          <p>{movie.Description.S}</p>
          <div className="details-buttons">
            <Button variant="outline" className="text-lg py-8 px-10 rounded-full font-medium">
              <PlayIcon className="mr-2" /> Watch Movie
            </Button>
            <Link to={`/movies/${movie.MovieId.S}`}>
              <Button className="text-lg py-8 px-10 rounded-full font-medium bg-transparent border-2 border-slate-400">
                More Info <ArrowRightIcon className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
  );
}

export default HomeMovie;
