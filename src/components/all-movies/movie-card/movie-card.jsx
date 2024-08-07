import "./movie-card.css";
import { Badge } from "@/components/ui/badge";
import MovieCover from "@/assets/movie-placeholder.webp";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Link } from "react-router-dom";

function MovieCard({ MovieId, Title, Genre, CoverS3Url, Series }) {
  return (
    <Link to={!Series ? `/movies/${MovieId}` : `/series/${Title}`} className="movie-card-link">
      <div className="movie-card">
        <div className="movie-image" style={{ backgroundImage: `url(${CoverS3Url})` }}>
          <Badge className="capitalized">{Genre}</Badge>
        </div>
        <div className="movie-title">
          <h3 className="text-white scroll-m-20 text-2xl font-semibold tracking-tight">{Title}</h3>
          <ArrowRightIcon className="text-white" />
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
