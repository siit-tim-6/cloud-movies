import "./movie-card.css";
import { Badge } from "@/components/ui/badge";
import MovieCover from "@/assets/movie-placeholder.webp";
import { ArrowRightIcon } from "@radix-ui/react-icons";

function MovieCard() {
  return (
    <div className="movie-card">
      <div className="movie-image" style={{ backgroundImage: `url(${MovieCover})` }}>
        <Badge>Sci-Fi</Badge>
      </div>
      <div className="movie-title">
        <h3 className="text-white scroll-m-20 text-2xl font-semibold tracking-tight">Star Wars</h3>
        <ArrowRightIcon className="text-white" />
      </div>
    </div>
  );
}

export default MovieCard;
