import "./home.css";
import React, {useContext, useEffect, useRef, useState} from "react";
import Navbar from "@/components/navbar/navbar";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, EffectCoverflow, Navigation, Autoplay } from "swiper/modules";
import HomeMovie from "@/components/home/home-movie/home-movie";
import axios from "axios";
import { AccountContext } from "../auth/accountContext";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

function Home() {
    const [movies, setMovies] = useState([]);
    const { getSession } = useContext(AccountContext);

    useEffect(() => {
        const fetchMovies = async () => {
            const session = await getSession();

            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/get-feed`, {
                    headers: {
                        Authorization: session.accessToken.jwtToken,
                    },
                });

                console.log(response.data);
                if (response.data.length === 0) {
                    window.alert("Feed is being generated. Please check back soon.");
                } else {
                    setMovies(response.data);
                }
            } catch (error) {
                console.error("Error fetching movies:", error);
            }
        };

        fetchMovies();
    }, [getSession]);

    return (
        <>
            <Navbar />
            <Swiper
                effect={"coverflow"}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={"auto"}
                coverflowEffect={{
                    rotate: 50,
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows: true,
                }}
                pagination={true}
                modules={[EffectCoverflow, Pagination, Autoplay, Navigation]}
                className="mySwiper"
                navigation
                autoplay={{
                    delay: 4500,
                    disableOnInteraction: false,
                }}
            >
                {movies.map((movie, index) => (
                    <SwiperSlide key={index}>
                        <HomeMovie movie={movie} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </>
    );
}

export default Home;
