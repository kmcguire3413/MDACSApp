let MDACSAuthLogin = {};

/// <summary>
/// Initial model
/// </summary>
/// <pure/>
MDACSAuthLogin.InitialState = {
    username: '',
    password: '',
};

/// <summary>
/// Controller/Mutator
/// </summary>
/// <pure/>
MDACSAuthLogin.Mutators = {
    onUserChange: (e, props, state, setState) => setState({ username: e.target.value }),
    onPassChange: (e, props, state, setState) => setState({ password: e.target.value }),
    onSubmit: (e, props, state, setState) => {
        e.preventDefault();

        if (props.onCheckLogin) {
            props.onCheckLogin(state.username, state.password);
        }
    },
};

/// <summary>
/// View
/// </summary>
/// <pure/>
MDACSAuthLogin.View = (props, state, setState, mutators) => {
    let onUserChange = (e) => mutators.onUserChange(e, props, state, setState);
    let onPassChange = (e) => mutators.onPassChange(e, props, state, setState);
    let onSubmit = (e) => mutators.onSubmit(e, props, state, setState);

    return (
        <div>
            <form onSubmit={onSubmit}>
                <FormGroup>
                    <ControlLabel>Username</ControlLabel>
                    <FormControl
                        id="login_username"
                        type="text"
                        value={state.username}
                        placeholder="Enter username"
                        onChange={onUserChange}
                    />
                    <ControlLabel>Password</ControlLabel>
                    <FormControl
                        id="login_password"
                        type="password"
                        value={state.password}
                        placeholder="Enter password"
                        onChange={onPassChange}
                    />
                    <FormControl.Feedback />
                    <Button id="login_submit" type="submit">Login</Button>
                </FormGroup>
            </form>
        </div>
    );
};

/// <summary>
/// </summary>
/// <prop-event name="onCheckLogin(username, password)">Callback when login should be checked.</prop-event>
MDACSAuthLogin.ReactComponent = class extends React.Component {
    constructor(props) {
        super(props);
        this.state = MDACSAuthLogin.InitialState;
    }

    render() {
        return MDACSAuthLogin.View(
            this.props,
            this.state,
            this.setState.bind(this),
            MDACSAuthLogin.Mutators
        );
    }
}
