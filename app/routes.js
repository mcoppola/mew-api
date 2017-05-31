import { Router } from 'express';

import MetaController from './controllers/meta.controller';
import AuthController from './controllers/auth.controller';
import UsersController from './controllers/users.controller';
import ListsController from './controllers/lists.controller';
import AlbumsController from './controllers/albums.controller';
import AlbumPointController from './controllers/albumPoint.controller';
import SpotifyController from './controllers/spotify.controller';

import authenticate from './middleware/authenticate';
import constants from './config/constants';

const routes = new Router();
const prefix = constants.apiPrefix;

routes.get(`${prefix}/`, MetaController.index);

// Authentication
routes.post(`${prefix}/auth/login`, AuthController.login);

// Users
routes.get(`${prefix}/users`, UsersController.search);
routes.post(`${prefix}/users`, UsersController.create);
routes.get(`${prefix}/users/me`, authenticate, UsersController.fetch);
routes.put(`${prefix}/users/me`, authenticate, UsersController.update);
routes.delete(`${prefix}/users/me`, authenticate, UsersController.delete);
routes.get(`${prefix}/users/:username`, UsersController._populate, UsersController.fetch)

// List
routes.get(`${prefix}/lists`, ListsController.search);
routes.post(`${prefix}/lists`, authenticate, ListsController.create);
routes.get(`${prefix}/lists/:listId`, ListsController._populate, ListsController.fetch);
routes.delete(`${prefix}/lists/:listId`, authenticate, ListsController.delete);

// Album
routes.get(`${prefix}/albums`, AlbumsController.search);
routes.post(`${prefix}/albums`, authenticate, AlbumsController.create);
routes.get(`${prefix}/albums/:albumId`, AlbumsController._populate, AlbumsController.fetch);
routes.delete(`${prefix}/albums/:albumId`, authenticate, AlbumsController.delete);

// Album Points
routes.post(`${prefix}/points`, authenticate, AlbumPointController.create);
 
// Spotify
routes.get(`${prefix}/spotify/login`, authenticate, SpotifyController.login);
routes.get(`${prefix}/spotify/top-tracks`, SpotifyController.topTracks);  // TODO: needs some kind of auth
routes.get(`${prefix}/spotify/reauthorize`, SpotifyController.reauthorize);  // TODO: needs some kind of auth



export default routes;
