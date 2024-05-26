import React, {useState} from "react";
import {useParams} from "react-router-dom";
import Navbar from "@/components/navbar/navbar.jsx";
import {Badge} from "@/components/ui/badge.jsx";
import MovieCover from "@/assets/movie-placeholder.webp";
import "./movie-details.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlay} from "@fortawesome/free-solid-svg-icons";
import {Swiper, SwiperSlide} from "swiper/react";
import MovieCard from "@/components/all-movies/movie-card/movie-card.jsx";
import Rating from "react-rating-stars-component";
import {Autoplay, Navigation} from "swiper/modules";

function MovieDetails() {
    const { id } = useParams();

    const [rating, setRating] = useState(4);

    const ratingChanged = (newRating) => {
        setRating(newRating);
    };

    return (
        <>
            <Navbar />
            <div className="movie-details-page">
                <div className="movie-cover" style={{ backgroundImage: `url(${MovieCover})` }}>
                    <div className="play-button">
                        <FontAwesomeIcon icon={faPlay} />
                    </div>
                </div>
                <div className="movie-info">
                    <h1>Star Wars</h1>
                    <div className="movie-genre-rating">
                        <Badge className="movie-genre">Sci-Fi</Badge>
                        <div className="rating">
                            <Rating
                                count={5}
                                value={rating}
                                edit={false}
                                size={24}
                                activeColor="#ffd700"
                            />
                        </div>
                    </div>
                    <p className="movie-description">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit iure minus rerum et qui ipsam, cum error beatae numquam vero voluptates illum
                        accusamus officia officiis! Distinctio nulla necessitatibus veniam fuga.
                    </p>
                    <div className="movie-meta">
                        <div className="meta-item">
                            <strong>Actors:</strong> Mark Hamill, Harrison Ford, Carrie Fisher
                        </div>
                        <div className="meta-item">
                            <strong>Directors:</strong> George Lucas
                        </div>
                        <div className="meta-item">
                            <strong>Genres:</strong> Sci-Fi, Adventure, Fantasy
                        </div>
                    </div>
                </div>
                <div className="recommendations">
                    <h2>You could also watch:</h2>
                    <Swiper
                        modules={[Navigation, Autoplay]}
                        spaceBetween={30}
                        slidesPerView={3}
                        navigation
                        pagination={{ clickable: true }}
                        autoplay={{
                            delay: 4500,
                            disableOnInteraction: false,
                        }}
                        breakpoints={{
                            640: {
                                slidesPerView: 1,
                                spaceBetween: 20,
                            },
                            768: {
                                slidesPerView: 2,
                                spaceBetween: 40,
                            },
                            1024: {
                                slidesPerView: 3,
                                spaceBetween: 50,
                            },
                        }}
                        className="swiper-container"
                    >
                        <SwiperSlide className="swiper-slide">
                            <MovieCard />
                        </SwiperSlide>
                        <SwiperSlide className="swiper-slide">
                            <MovieCard />
                        </SwiperSlide>
                        <SwiperSlide className="swiper-slide">
                            <MovieCard />
                        </SwiperSlide>
                        <SwiperSlide className="swiper-slide">
                            <MovieCard />
                        </SwiperSlide>
                        <SwiperSlide className="swiper-slide">
                            <MovieCard />
                        </SwiperSlide>
                    </Swiper>
                </div>
            </div>
        </>
    );
}

export default MovieDetails;
