"use strict";

const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand  } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
    const moviesTableName = process.env.MOVIES_TABLE;
    const feedsTableName = process.env.FEEDS_TABLE;
    const userId = event.userId;

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

    const getTotalGenreScore = (movie) => {
        return movie.Genres.L.reduce((total, genreObj) => {
            const genre = genreObj.S.toLowerCase();
            const score = genreScores[genre] || 0;
            return total + score;
        }, 0);
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
            ProjectionExpression: "MovieId, CreatedAt",
        });

        const movieResponse = await dynamoDocClient.send(dynamoScanCommand);
        if (!movieResponse.Items || movieResponse.Items.length === 0) {
            return [];
        }

        return movieResponse.Items.sort((a, b) => new Date(b.CreatedAt.S) - new Date(a.CreatedAt.S)).slice(0, 5);
    };

    const processEntityMovies = async (entity, weight) => {
        const moviesByEntity = await fetchMoviesByEntity(entity.value, entity.type);
        for (const movie of moviesByEntity) {
                movieIds.add(movie.MovieId.S);
                addToGenreScores(movie, weight);
        }
    };

    const processSubscriptions = subscriptions.map(async (sub) => {
        await processEntityMovies(sub, 3);
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
                await processEntityMovies({ value: genre, type: 'genre' }, weight / 2);
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
                await processEntityMovies({ value: genre, type: 'genre' }, 0.5);
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

        const newestMovieIds = newestMovies.map(movie => movie.MovieId.S);

        const updateCommand = new PutCommand({
            TableName: feedsTableName,
            Item: {
                UserId: userId,
                Feed: newestMovieIds,
            },
        });
        await dynamoDocClient.send(updateCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Feed updated successfully" }),
        };
    }

    const personalizedFeed = moviesDetails.sort((a, b) => {
        const genreScoreA = getTotalGenreScore(a);
        const genreScoreB = getTotalGenreScore(b);

        if (genreScoreA !== genreScoreB) {
            return genreScoreB - genreScoreA;
        }

        const downloadDateA = downloadDates[a.MovieId.S];
        const downloadDateB = downloadDates[b.MovieId.S];
        if (downloadDateA && downloadDateB) {
            return downloadDateB - downloadDateA;
        }

        return new Date(b.CreatedAt.S) - new Date(a.CreatedAt.S);
    }).map(movie => movie.MovieId.S);

    const updateCommand = new PutCommand({
        TableName: feedsTableName,
        Item: {
            UserId: userId,
            Feed: personalizedFeed.slice(0, 10),
        },
    });
    await dynamoDocClient.send(updateCommand);

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Feed updated successfully" }),
    };
};
