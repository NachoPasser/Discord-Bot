const axios = require('axios')
async function getVideoFromYt(params){
    try {
        const response = await axios.get(`https://youtube.googleapis.com/youtube/v3/search`, {params});
        const video = response.data.items[0]
        return video
    } catch (error) {
        console.log(error)
    }
}
module.exports = getVideoFromYt