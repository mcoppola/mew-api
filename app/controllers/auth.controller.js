import UserModel from '../models/user';
import BaseController from './base.controller';
import SpotifyWebApi from 'spotify-web-api-node'


class AuthController extends BaseController {
  constructor(props) {
    super(props)
    
    this.spotifyApi = new SpotifyWebApi({
      clientId : '24ff5979c65f4eff8b7ece06329d8afc',
      clientSecret: 'b20a6499e02642e6b2449827da0288d1',
      redirectUri : 'http://localhost:3000/spotify'  
    })

    this.spotify = this.spotify.bind(this);
  }


  login = (req, res) => {
    const { username, password } = req.body;

    UserModel.findOne({ username })
      .then((user) => {
        if (!user || !user.authenticate(password)) {
          return res.status(401).json({
            message: 'Please verify your credentials.',
          });
        }

        const token = user.generateToken();
        return res.status(200).json({ token });
      })
      .catch((err) => {
        res.status(500).json(err);
      });
  }


  // SPOTIFY user auth
  spotify = (req, res) => {
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
}

export default new AuthController();
