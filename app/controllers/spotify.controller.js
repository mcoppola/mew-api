import UserModel from '../models/user';
import BaseController from './base.controller';
import SpotifyWebApi from 'spotify-web-api-node'
import User from '../models/user';
import Album from '../models/album';
import AlbumPoint from '../models/albumPoint';
import points from '../config/points';
import * as R from 'ramda';


// Spotify app credentials (mew-dev)
const clientId = '24ff5979c65f4eff8b7ece06329d8afc'
const clientSecret = 'b20a6499e02642e6b2449827da0288d1'
const redirectUri = 'http://localhost:3000/spotify-callback'
const scopes = ['user-read-private', 'user-read-email', 'user-top-read']


class SpotifyController extends BaseController {
  constructor(props) {
    super(props)
    
    this.spotifyApi = new SpotifyWebApi({
      clientId,
      clientSecret,
      redirectUri,
    })

    this.login = this.login.bind(this)
    this.topTracks = this.topTracks.bind(this)
    this._asocAlbum = this._asocAlbum.bind(this)
    this._createIfMissing = this._createIfMissing.bind(this)
  }


  // SPOTIFY user auth
  login = (req, res) => {
    if (!req.currentUser) {
      return res.sendStatus(403);
    }
    if (!req.query.code) {
      return res.status(401).json({
        message: 'Missing Spotify code'
      })
    }
    // Retrieves an access token and a refresh token,
    // and sends it back to the client
    this.spotifyApi.authorizationCodeGrant(req.query.code)
      .then(
        data => res.status(200).json(data.body)
        ,
        err => res.status(500).json(err)
        )
  }

  // Access token has expired. Use refresh token 
  // to apply for a new  access token.  
  reauthorize = (req, res) => {
    if (!req.query.userId) {
      return res.sendStatus(401).json({ message: 'Missing userId param' })
    }

    return User.findById(req.query.userId)
      .then( user => {
        if (!user.spotifyRefresh) {
          return res.sendStatus(403).json({ message: 'User is missing Spotify Refresh code' })
        }

        this.spotifyApi.setRefreshToken(user.spotifyRefresh)
        this.spotifyApi.refreshAccessToken()
        .then( data => {

          // Save the access token so that it's used in future calls
          this.spotifyApi.setAccessToken(data.body['access_token'])

          return User.update(user, { spotifyAccess: data.body['access_token'] })
            .then(() => {
              return res.sendStatus(204);
            })
            .catch( err  => res.status(400).json(this.formatApiError(err)))
        }, (err) => {
          console.log('Could not refresh access token', err);
        })
    })
  }


  // Get's a user's top tracks from Spotify
  // and adds a point for each item
  topTracks = (req, res) => {
    if (!req.query.userId) {
      return res.sendStatus(401).json({ message: 'Missing userId param' })
    }

    User.findById(req.query.userId)
      .then( user => {
          if (!user.spotifyAccess) {
            return res.sendStatus(401).json({ message: 'User has not authorized spotify' })
          }

          this.spotifyApi.setAccessToken(user.spotifyAccess)
          this.spotifyApi.setRefreshToken(user.spotifyRefresh)

          this.spotifyApi.getMyTopTracks({ 
            time_range: 'short_term',
            limit: 10
          })
          .then( data => {

            Promise.all(
              R.map(this._asocAlbum, data.body.items))
            .then(albums => 
              Promise.all(
                R.map(R.curry(this._createIfMissing)(user), albums)))
            .then(albums => 
              Promise.all(
                R.map(R.curry(this._addPoint)(user), albums)))
            
            .catch(err => console.log(err))


            return res.json(data.body)
          }, err => console.log(err))
          .catch( err => console.log(err) )
      })
      .catch( err => res.json(err));
  }

  // Associate a Spotify Track with an album
  // in the db
  _asocAlbum = (spotifyTrack) => {
    // First, try to look up by spotify ID
    return Album.findOne({ spotifyId: spotifyTrack.id })
      .then( album => {
        if (album) {
          return album
        } else {

          // Second, try to find it by album title + artist name
          return Album.findOne({ title: spotifyTrack.album.name, artist: spotifyTrack.artists[0].name })
            .then( album => {
              if (album) {
                // Add spotify ID to Album 
                return Album.update(album, { spotifyId: spotifyTrack.id })
                  .then( album => {
                    return album
                  }).catch(e => console.log)
              } else {
                // return spotifyTrack obj to be created later
                return spotifyTrack
              }
            })
        }
      })
  }

  _createIfMissing = (_user, album) => {
    // First, make sure it's a spotify track obj
    if (album.uri && album.uri.indexOf('spotify:') > -1) {

      return Album.create({
        title: album.album.name,
        artist: album.artists[0].name,
        image: album.album.images.map(i => i.url),
        _user, _user
      }).then(album => { return album })

    } else {
      // not a spotify track obj, return it
      return album
    }
  }

  _addPoint = (_user, album) => {
    const albumPoint = new AlbumPoint({ album: album._id, _user: _user._id });
    albumPoint.value = points.values['spotifyTopTrack']
    albumPoint.action = 'spotifyTopTrack'

    return albumPoint.save()
  }
}

export default new SpotifyController();
