

const config = {

	points: {
		values: {
			'upvote': 1,
			'spotifyTopTrack': 1
		},

		time: {
			'upvote': 1000*60*60*24*3 // 3 days
			// 'upvote': 1000*60*60*24 // 1 day
			// 'upvote': 1000*60 // 1 minute
		}
	},

	dollars: {
		// 1$ per growRate
		// growRate: 1000*60*60, // 1 hour
		growRate: 1000*60*60*(24/10), // 10 per day

		startAmount: 10,

		startDate: (new Date('Wed Jun 28 2017 00:0:00 GMT-0400'))
	}

}
export default config