const CLIENT_ID="TU_CLIENT_ID"

const REDIRECT_URI=
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