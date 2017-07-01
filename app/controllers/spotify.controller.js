import UserModel from '../models/user';
import BaseController from './base.controller';
import SpotifyWebApi from 'spotify-web-api-node'
import User from '../models/user';
import Album from '../models/album';
import AlbumPoint from '../models/albumPoint';

import config from '../config/points';
import constants from '../config/constants'
import * as R from 'ramda';


// Spotify app credentials (mew-dev)
const clientId = '24ff5979c65f4eff8b7ece06329d8afc'
const clientSecret = 'b20a6499e02642e6b2449827da0288d1'
const redirectUri = constants.spotify.callback
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
      .catch(err => res.status(500).json(err))
  }

  // POST /spotify/reathorize
  //
  // Access token has expired. Use refresh token 
  // to apply for a new  access token.  
  reauthorize = (req, res) => {
    if (!req.currentUser._id) {
      return res.sendStatus(401).json({ message: 'Missing userId param' })
    }

    return User.findById(req.currentUser._id)
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
            .then(
              res.status(200).json({ access_token: data.body['access_token']} )
            )
            .catch( err  => res.status(400).json(this.formatApiError(err)))
        }, (err) => {
          console.log('Could not refresh access token', err);
        })
    })
  }

  _reauthorize = (user) => {
    return new Promise((resolve, reject) => {
      if (!user.spotifyRefresh) {
        reject('User is missing spoitfy credentials')
      }
      this.spotifyApi.setRefreshToken(user.spotifyRefresh)

      this.spotifyApi.refreshAccessToken()
        .then( data => {
          // Save the access token so that it's used in future calls
          this.spotifyApi.setAccessToken(data.body['access_token'])
          let newUser = user
          newUser.spotifyAccess = data.body['access_token']
          User.update(user, { spotifyAccess: data.body['access_token'] })
            .then(u => resolve(newUser))
            .catch( err  => reject(this.formatApiError(err)))

        }, (err) => 
          reject('Could not refresh access token', err)
        )
    })
  }


  // Get's a user's top tracks from Spotify
  // and adds a point for each item
  topTracks = (req, res) => {
    if (!req.currentUser._id) {
      return res.sendStatus(401).json({ message: 'Missing current user credentials' })
    }
    let user

    User.findById(req.currentUser._id)
    .then( u => { 
      user = u
      return this._getTopTracks(u)
    })
    .then( data => {

        Promise.all(R.map(this._asocAlbum, data.body.items))
        .then(albums => Promise.all(R.map(R.curry(this._createIfMissing)(user), albums)))
        .then(albums => Promise.all(R.map(R.curry(this._addPoint)(user), albums)))
        .catch(err => console.log(err))

        return res.json(data.body)
      })
      .catch( err => res.json(err));
  }

  // GET /spotify/all-top-tracks  (root)
  //
  // Calculates all users top tracks from Spoitfy
  // and adds points for each item
  allTopTracks = (req, res) => {

    User.find({})
      .then( users => {
        Promise.all(R.map(
          u => 
          new Promise((resolve, reject) => {
            this._reauthorize(u)
            .then(this._getTopTracks)
            .then( data => {
                Promise.all(R.map(this._asocAlbum, data.body.items))
                  .then( albums => Promise.all(R.map(R.curry(this._createIfMissing)(u), albums)))
                  .then( albums => Promise.all(R.map(R.curry(this._addPoint)(u), albums)))
                  .then( res => { 
                    resolve(data.body.items)
                  })
                  .catch(err => { 
                    reject(err)
                  })
              })
              .catch( err => reject(err))
              // Only users who have authorized spotify
          }), users.filter(u => !!u.spotifyAccess )))
        .then(response => {
          res.json(respose)
        })
        .catch(err => res.json(err))
      })
  }

  _getTopTracks = (user) => {
    return new Promise((resolve, reject) => {
      if (!user.spotifyAccess) {
        return reject('User has not authorized spotify')
      }
      this.spotifyApi.setAccessToken(user.spotifyAccess)
      this.spotifyApi.setRefreshToken(user.spotifyRefresh)
      this.spotifyApi.getMyTopTracks({ 
        time_range: 'short_term',
        limit: 10
      })
      .then(resolve)
      .catch(reject)
    })
  }

  // Associate a Spotify Track with an album
  // in the db
  _asocAlbum = (spotifyTrack) => {
    return new Promise((resolve, reject) => {
      // First, try to look up by spotify ID
      this._findAlbumBySpotifyId( spotifyTrack.id )
      .then( album => {
        if (album) {
          resolve(album)
        } else {
          // Second, try to find it by album title + artist name
          this._findAlbumByTitleAndArtist( spotifyTrack.album.name, spotifyTrack.artists[0].name )
            .then( album => {
              if (album) {
                // Add spotify ID to Album 
                Album.update(album, { spotifyId: spotifyTrack.id })
                  .then( ok => {
                    resolve(album)
                  })
                  .catch(reject)
              } else {
                // return spotifyTrack obj to be created later
                resolve(spotifyTrack)
              }
            })
        }
        })
    })
  }

  _findAlbumBySpotifyId = (id) => {
    return new Promise((resolve, reject) => {
      Album.findOne({ spotifyId: id })
      .then(resolve)
      .catch(reject)
    })
  }

  _findAlbumByTitleAndArtist = (title, artist) => {
    return new Promise((resolve, reject) => {
      Album.findOne({ title, artist })
      .then(resolve)
      .catch(reject)
    })
  }

  _createIfMissing = (_user, album) => {
    return new Promise((resolve, reject) => {
      // First, make sure it's a spotify track obj
      if (album.uri && album.uri.indexOf('spotify:') > -1) {
        Album.create({
          title: album.album.name,
          artist: album.artists[0].name,
          image: album.album.images.map(i => i.url),
          _user, _user
        })
        .then(album => resolve(album) )
        .catch(e => reject(e))
      } else {
        // not a spotify track obj, return it
        resolve(album)
      }
    })
  }

  _addPoint = (_user, album) => {
    return new Promise((resolve, reject) => {
      console.log('POINTS for: ' + _user.username + ' ' + album.title);
      const albumPoint = new AlbumPoint({ album: album._id, _user: _user._id });
      albumPoint.value = config.points.values['spotifyTopTrack']
      albumPoint.action = 'spotifyTopTrack'

      albumPoint.save()
        .then(ok => resolve(album))
        .catch(e => reject(e))
    })
  }
}

export default new SpotifyController();
