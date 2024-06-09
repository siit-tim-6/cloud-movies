import "./home.css";
import React from "react";
import Navbar from "@/components/navbar/navbar";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, EffectCoverflow, Navigation, Autoplay } from "swiper/modules";
import HomeMovie from "@/components/home-movie/home-movie";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

function Home() {
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
        <SwiperSlide>
          <HomeMovie />
        </SwiperSlide>
        <SwiperSlide>
          <HomeMovie />
        </SwiperSlide>
        <SwiperSlide>
          <HomeMovie />
        </SwiperSlide>
        <SwiperSlide>
          <HomeMovie />
        </SwiperSlide>
        <SwiperSlide>
          <HomeMovie />
        </SwiperSlide>
      </Swiper>
    </>
  );
}

export default Home;
