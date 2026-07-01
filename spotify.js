const CLIENT_ID="5a259001840a41d2a455fde31fd41b93"

const REDIRECT_URI=
"https://sirius17.github.io/en-una-nota/"
window.location.origin
+
window.location.pathname

function loginSpotify(){

let url=

`https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-library-read`

window.location.href=
url

}

function conectado(){

return window
.location
.search
.includes(
"code="
)

}