import React from "react";
import {useParams} from "react-router-dom";
import Navbar from "@/components/navbar/navbar.jsx";
import {Badge} from "@/components/ui/badge.jsx";
import MovieCover from "@/assets/movie-placeholder.webp";
import "./movie-details.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlay} from "@fortawesome/free-solid-svg-icons";
import {Swiper, SwiperSlide} from "swiper/react";
import MovieCard from "@/components/all-movies/movie-card/movie-card.jsx";

function MovieDetails() {
    const { id } = useParams(); 

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
                    <Badge className="movie-genre">Sci-Fi</Badge>
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
                        spaceBetween={30}
                        slidesPerView={3}
                        navigation={{ nextEl: null, prevEl: null }}
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
