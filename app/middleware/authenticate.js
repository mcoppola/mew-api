import jwt from 'jsonwebtoken';
import User from '../models/user';
import Constants from '../config/constants';

const { sessionSecret } = Constants.security;

export const authenticate = (req, res, next) => {
  const { authorization } = req.headers;
  jwt.verify(authorization, sessionSecret, (err, decoded) => {
    if (err) {
      return res.sendStatus(401);
    }

    // If token is decoded successfully, find user and attach to our request
    // for use in our route or other middleware
    User.findById(decoded._id)
      .then((user) => {
        if (!user) {
          return res.sendStatus(401);
        }
        req.currentUser = user;
        next();
      })
      .catch((err) => next(err));
  });
}

export const authenticateRoot = (req, res, next) => {
  // TODO: root user
  if (req.query.key === 'EBDEj9@qK&bGqnRs') {
    next()
  } else {
    return res.sendStatus(401)
  }
}