import * as R from 'ramda'
import points from '../config/points'

/**
 * Points 'now' calculation
 */
export const pointsNow =
  R.pipe(
    R.filter(p => {
      let timestamp = new Date(p.createdAt).getTime()
      let cutoff = Date.now() - points.time.upvote
      return timestamp >= cutoff
    }),
    R.pluck('value'),
    R.sum
  )

/**
 * Extract users from Points
 */
export const pointsUsers = 
  R.pipe(
    R.map(p => p._user),
    R.uniqBy(u => u.username)
  )