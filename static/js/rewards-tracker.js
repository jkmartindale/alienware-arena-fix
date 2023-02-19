const pollDuration = 60000;
let authToken;
let channelId;

window.addEventListener("message", (event) => {
    authToken = event.data.token;
    channelId = event.data.channelId;

    handlePolling();
});

handlePolling = () => {

    fetch(`https://alienware.jkmartindale.dev/?url=https://www.alienwarearena.com/twitch/extensions/track`, {
        method: 'GET',
        headers: {
            'x-extension-jwt': authToken,
            'x-extension-channel': channelId
        }
    })
    .then(response => response.json())
    .then(data => {

        console.log(data);

        [...document.getElementsByClassName("state")].forEach((el) => {
            el.classList.add('hidden');
        })

        if (data.success) {
            document.getElementById('logged_out').classList.add('hidden');
        }

        document.getElementById(data.state).classList.remove('hidden');
    })
    .catch((err) => {
        console.log(err);
    })
    .finally(() => {
        setTimeout(handlePolling, pollDuration);
    });
}
