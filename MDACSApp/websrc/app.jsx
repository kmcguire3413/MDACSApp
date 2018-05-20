/// Bootstrap the application.
request
    .get('./get-config')
    .end((err, res) => {
        if (err) {
            ReactDOM.render(
                <Alert>Uhoh! There was a failure when requesting the application configuration! Try again or wait a few minutes.</Alert>,
                document.getElementById('root')
            );
        } else {
            const cfg = JSON.parse(res.text);

            ReactDOM.render(
                <MDACSAuthLoginSwitcher.ReactComponent
                    authUrl={cfg.authUrl}
                    dbUrl={cfg.dbUrl}
                    />,
                    document.getElementById('root')
            );            
        }
    });