const axios = require('axios')
async function getVideoFromYt(params){
    try {
        const response = await axios.get(`https://youtube.googleapis.com/youtube/v3/search`, {params});
        const video = response.data.items[0]
        return video
    } catch (error) {
        console.log(error.response)
        if(error.response.statusText === 'Quota Exceeded') throw new Error('Quota Exceeded')
        else throw new Error('Unexpected')
    }
}
module.exports = getVideoFromYt