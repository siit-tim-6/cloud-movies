import { Button } from "@/components/ui/button";
import "./movie-search.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

function MovieSearch({setMovies}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actors, setActors] = useState("");
  const [directors, setDirectors] = useState("");
  const [genres, setGenres] = useState("");

    const handleSearch = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/search-movies`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                description,
                actors,
                directors,
                genres,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            setMovies(data);
        } else {
            console.error("Failed to fetch movies");
        }
    };

  return (
    <div className="movie-search">
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Search Movies</h3>
      <Label htmlFor="title">Title</Label>
      <Input
        id="title"
        className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-black dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <Label htmlFor="description">Description</Label>
      <Input
        id="description"
        className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-black dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <Label htmlFor="actors">Actors</Label>
      <Input
        id="actors"
        className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-black dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
        value={actors}
        onChange={(event) => setActors(event.target.value)}
      />
      <Label htmlFor="directors">Directors</Label>
      <Input
        id="directors"
        className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-black dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
        value={directors}
        onChange={(event) => setDirectors(event.target.value)}
      />
      <Label htmlFor="genres">Genres</Label>
      <Input
        id="genres"
        className="flex h-10 w-full border-none bg-gray-50 dark:bg-zinc-800 text-black dark:text-white rounded-md px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:placeholder-text-neutral-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0px_0px_1px_1px_var(--neutral-700)] group-hover/input:shadow-none transition duration-400"
        value={genres}
        onChange={(event) => setGenres(event.target.value)}
      />
        <Button
            id="submit-button"
            variant="secondary"
            className="text-lg py-6 px-10 rounded-medium font-bold text-white bg-gradient-to-br from-zinc-900 dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 dark:bg-zinc-800"
            onClick={handleSearch}
        >
            Search
        </Button>
    </div>
  );
}

export default MovieSearch;
