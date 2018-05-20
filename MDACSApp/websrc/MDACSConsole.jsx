MDACSConsole = {};

MDACSConsole.ReactComponent = class extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            history: [],
            curCommand: null,
        };
    }

    commandValueChanged (e) {
        this.setState({
            curCommand: e.target.value,
        })
    }

    interpretCommand () {
        let cmd = this.state.curCommand;

        if (cmd === null) {
            return;
        }

        let insideQuotes = false;

        let majorParts = [];
        let curBuffer = [];

        for (let x = 0; x < cmd.length; ++x) {
            let c = cmd[x];

            if (c === '"') {
                if (insideQuotes) {
                    insideQuotes = false;
                } else {
                    insideQuotes = true;
                }
                continue;
            }

            if (c === ' ' && insideQuotes === false) {
                curBuffer = curBuffer.join('').trim();
                if (curBuffer.length > 0) {
                    majorParts.push(curBuffer);
                }
                
                curBuffer = [];
                continue;
            }

            curBuffer.push(c);
        }

        curBuffer = curBuffer.join('').trim();
        if (curBuffer.length > 0) {
            majorParts.push(curBuffer);
        }        

        curBuffer = [];

        let cmds = [];
        let opts = {};

        for (let x = 0; x < majorParts.length; ++x) {
            let part = majorParts[x];

            if (part.indexOf('--') === 0 || part.indexOf('-') === 0) {
                // option
                if (part.indexOf('=') > -1) {
                    let pos;

                    if (part.substring(0, 2) === '--') {
                        pos = 2;
                    } else {
                        pos = 1;
                    }

                    let key = part.substring(pos, part.indexOf('='));
                    let val = part.substring(part.indexOf('=') + 1);
                    opts[key] = val;
                }
            } else {
                // positional
                cmds.push(part);
            }
        }

        // The final generalized command form that will be transmitted.
        let pkg = {
            cmds: cmds,
            opts: opts,
        };

        return pkg;
    }

    commandSubmit (e) {
        e.preventDefault();

        const state = this.state;
    }

    render() {
        const pkg = this.interpretCommand();

        const state = this.state;
        const history = state.history;

        const prettyCommand = JSON.stringify(pkg, null, 4);

        return <div className="MDACSConsoleContainer">
            <div style={{ 'font-size': '14pt', 'whiteSpace': 'pre' }}>
                {prettyCommand}
            </div>
            <div>
                <form onSubmit={this.commandSubmit.bind(this)}>
                    <FormControl
                        componentClass="textarea"
                        value={this.state.value}
                        placeholder="Enter the command to be executed."
                        onChange={this.commandValueChanged.bind(this)}
                        style={{ 'font-size': '18pt' }}
                    />
                </form>
            </div>
            <div>
            </div>
        </div>;
    }
}