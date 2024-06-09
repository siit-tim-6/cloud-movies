import { Button } from "@/components/ui/button";
import "./home-movie.css";
import MovieCover from "@/assets/movie-placeholder.webp";
import { PlayIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import {Link} from "react-router-dom";

function HomeMovie() {
  return (
    <div className="home-movie" style={{ backgroundImage: `url(${MovieCover})` }}>
      <div className="movie-details">
        <Badge className="text-lg px-4 py-1 rounded-full font-medium">Sci-Fi</Badge>
        <h1>Star Wars</h1>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit iure minus rerum et qui ipsam, cum error beatae numquam vero voluptates illum accusamus
          officia officiis! Distinctio nulla necessitatibus veniam fuga.
        </p>
        <div className="details-buttons">
          <Button variant="outline" className="text-lg py-8 px-10 rounded-full font-medium">
            <PlayIcon className="mr-2" /> Watch Movie
          </Button>
          <Link to="/movies/1">
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
