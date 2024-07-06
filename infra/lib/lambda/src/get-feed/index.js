"use strict";

const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

exports.handler = async (event) => {
    const moviesTableName = process.env.MOVIES_TABLE;
    const bucketName = process.env.S3_BUCKET;

    const subscriptions = JSON.parse(event.subscriptions);
    const ratings = JSON.parse(event.ratings);
    const downloads = JSON.parse(event.downloads);

    const movieIds = new Set();
    const genreScores = {};
    const downloadDates = {};

    const addToGenreScores = (item, weight) => {
        if (item.Genres && item.Genres.L) {
            item.Genres.L.forEach((genre) => {
                const genreValue = genre.S.toLowerCase();
                if (!genreScores[genreValue]) {
                    genreScores[genreValue] = 0;
                }
                genreScores[genreValue] += weight;
            });
        }
    };

    const fetchMovieDetails = async (movieId) => {
        const dynamoScanCommand = new ScanCommand({
            TableName: moviesTableName,
            FilterExpression: "MovieId = :movieId",
            ExpressionAttributeValues: {
                ":movieId": { S: movieId },
            },
        });

        const movieResponse = await dynamoDocClient.send(dynamoScanCommand);
        if (!movieResponse.Items || movieResponse.Items.length === 0) {
            throw new Error(`Movie with ID ${movieId} not found`);
        }
        return movieResponse.Items[0];
    };

    const fetchMoviesByEntity = async (value, type) => {
        const dynamoScanCommand = new ScanCommand({
            TableName: moviesTableName,
            FilterExpression: `contains(#typeField, :value)`,
            ExpressionAttributeNames: {
                "#typeField": `${type.charAt(0).toUpperCase() + type.slice(1)}s`,
            },
            ExpressionAttributeValues: {
                ":value": { S: value.toLowerCase() },
            },
        });

        const entityResponse = await dynamoDocClient.send(dynamoScanCommand);
        return entityResponse.Items;
    };

    const fetchNewestMovies = async () => {
        const dynamoScanCommand = new ScanCommand({
            TableName: moviesTableName,
            ProjectionExpression: "MovieId, Title, Genres, CoverS3Url, VideoS3Url, Description, CreatedAt",
        });

        const movieResponse = await dynamoDocClient.send(dynamoScanCommand);
        if (!movieResponse.Items || movieResponse.Items.length === 0) {
            return [];
        }

        return movieResponse.Items.sort((a, b) => new Date(b.CreatedAt.S) - new Date(a.CreatedAt.S)).slice(0, 5);
    };

    const generateSignedUrls = async (movie, bucketName) => {
        const s3CoverUrlKey = movie.CoverS3Url.S.split(`https://${bucketName}.s3.amazonaws.com/`)[1];
        const s3VideoUrlKey = movie.VideoS3Url.S.split(`https://${bucketName}.s3.amazonaws.com/`)[1];

        const s3CoverSignedUrl = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: bucketName, Key: s3CoverUrlKey }), { expiresIn: 3600 });
        const s3VideoSignedUrl = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: bucketName, Key: s3VideoUrlKey }), { expiresIn: 3600 });

        return {
            ...movie,
            CoverS3Url: { S: s3CoverSignedUrl },
            VideoS3Url: { S: s3VideoSignedUrl },
        };
    };


    const processSubscriptions = subscriptions.map(async (sub) => {
        const moviesByEntity = await fetchMoviesByEntity(sub.value, sub.type);
        moviesByEntity.forEach((movie) => {
            movieIds.add(movie.MovieId.S);
            addToGenreScores(movie, 3);
        });
    });

    const processRatings = ratings.map(async (rating) => {
        const movie = await fetchMovieDetails(rating.movieId);
        movieIds.add(rating.movieId);

        let weight=0;
        if (rating.rating <= 2) {
            weight = -1;
        } else if (rating.rating === 4) {
            weight = 1;
        } else if (rating.rating === 5) {
            weight = 2;
        }
        addToGenreScores(movie, weight);

        if (movie.Genres && movie.Genres.L) {
            for (const genreObj of movie.Genres.L) {
                const genre = genreObj.S.toLowerCase();
                if (genreScores[genre] === weight) {
                    const moviesByGenre = await fetchMoviesByEntity(genre, 'genre');
                    moviesByGenre.forEach((movie) => {
                        movieIds.add(movie.MovieId.S);
                        addToGenreScores(movie, weight/2);
                    });
                }
            }
        }
    });

    const processDownloads = downloads.map(async (download) => {
        const movie = await fetchMovieDetails(download.movieId);
        movieIds.add(download.movieId);
        addToGenreScores(movie, 1);
        downloadDates[download.movieId] = new Date(download.downloadedAt);

        if (movie.Genres && movie.Genres.L) {
            for (const genreObj of movie.Genres.L) {
                const genre = genreObj.S.toLowerCase();
                if (genreScores[genre] === 1) {
                    const moviesByGenre = await fetchMoviesByEntity(genre, 'genre');
                    moviesByGenre.forEach((movie) => {
                        movieIds.add(movie.MovieId.S);
                        addToGenreScores(movie, 1/3);
                    });
                }
            }
        }
    });

    await Promise.all([...processSubscriptions, ...processRatings, ...processDownloads]);

    const movieDetailsPromises = Array.from(movieIds).map(fetchMovieDetails);
    const moviesDetails = await Promise.all(movieDetailsPromises);

    if (moviesDetails.length === 0) {
        const newestMovies = await fetchNewestMovies();
        if (newestMovies.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify([]),
            };
        }

        const newestMoviesWithCoverUrls = await Promise.all(newestMovies.map(movie => generateSignedUrls(movie, bucketName)));

        return {
            statusCode: 200,
            body: JSON.stringify(newestMoviesWithCoverUrls),
        };
    }

    const moviesWithCoverUrls = await Promise.all(moviesDetails.map(movie => generateSignedUrls(movie, bucketName)));

    const personalizedFeed = moviesWithCoverUrls.sort((a, b) => {
        const genreA = a.Genres.L[0].S;
        const genreB = b.Genres.L[0].S;
        const genreScoreA = genreScores[genreA] || 0;
        const genreScoreB = genreScores[genreB] || 0;

        if (genreScoreA !== genreScoreB) {
            return genreScoreB - genreScoreA;
        }

        const downloadDateA = downloadDates[a.MovieId.S];
        const downloadDateB = downloadDates[b.MovieId.S];
        if (downloadDateA && downloadDateB) {
            return downloadDateB - downloadDateA;
        }

        return new Date(b.CreatedAt.S) - new Date(a.CreatedAt.S);
    });

    return {
        statusCode: 200,
        body: JSON.stringify(personalizedFeed.slice(0, 10)),
    };
};
