import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from "react-router-dom";
import Home from "@/components/home/home.jsx";
import Login from "@/components/auth/login.jsx";
import Register from "@/components/auth/register.jsx";
import AllMovies from "@/components/all-movies/all-movies";
import { Toaster } from "@/components/ui/toaster";
import { AccountProvider } from "@/components/auth/accountContext";
import ProtectedRoutes from "./routes/protectedRoutes";
import MovieDetails from "@/components/movie-details/movie-details.jsx";
import UploadMovie from "@/components/upload-movie/upload-movie.jsx";
import SubscriptionList from "./components/subscription-list/subscription-list";
import SeriesDetails from "./components/series-details/series-details";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<AllMovies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/series/:title" element={<SeriesDetails />} />
        <Route path="/upload-movie" element={<UploadMovie />} />
        <Route path="/edit-movie/:id" element={<UploadMovie isEditMode={true} />} />
        <Route path="/subscriptions" element={<SubscriptionList />} />
      </Route>
    </>
  )
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AccountProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AccountProvider>
  </React.StrictMode>
);
