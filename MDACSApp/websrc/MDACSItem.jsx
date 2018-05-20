

class MDACSDataItemDate extends React.Component {
    render() {
        return this.props.item.jsDate.toLocaleDateString(); 
    }
}

class MDACSDataItemTime extends React.Component {
    render() {
        const d = this.props.item.jsDate;

        const pad2 = (v) => {
            v = String(v);

            if (v.length == 1) {
                return '0' + v;
            }

            return v;
        };

        return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
    }
}

class MDACSDataItemUser extends React.Component {
    render() {
        return this.props.value;
    }
}

class MDACSDataItemDevice extends React.Component {
    render() {
        return this.props.value;
    }
}

class MDACSDataItemNote extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            value: props.value,
            state: 'success',
        }
    }

    render() {
        const props = this.props;
        const state = this.state;
        const setState = this.setState.bind(this);

        const changeCancel = () => {
            setState({
                value: props.value,
                state: 'success',
            });
        };

        const changeNote = (doPrompt) => {
            let newNote 
            
            if (doPrompt) {
                newNote = prompt("Note", state.value);

                if (newNote === null) {
                    return;
                }
            } else {
                newNote = state.value;
            }

            setState({
                value: newNote,
                state: 'pending',
            });

            props.updater.setNote(props.sid, newNote, (success) => {
                if (success) {
                    setState({
                        state: 'success',
                    });
                } else {
                    setState({
                        state: 'error',
                    });
                }
            });
        };

        switch (state.state) {
            case 'success':
                return  <span>
                            <Button bsSize="xsmall" bsStyle="link" onClick={(e) => changeNote(true)}>Edit</Button>
                            {state.value}
                        </span>;
            case 'pending':
                return <Alert bsStyle="warning">Saving: {state.value}</Alert>;
            case 'error':
                return <Alert bsStyle="danger">
                            <Button bsStyle="success" onClick={(e) => changeNote(false)}>Retry</Button>
                            <Button bsStyle="warning" onClick={changeCancel}>Cancel</Button>
                        </Alert>;
        }
    }
}

function inList(v, l) {
    for (let x = 0; x < l.length; ++x) {
        if (l[x] === v) {
            return true;
        }
    }

    return false;
}

function forEachItemSet(base, items, setTo) {
    for (var x = 0; x < items.length; ++x) {
        var items_value = items[x];

        base[items_value] = setTo;
    }
}

class MDACSDataItemState extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            value: props.value,
            state: 'success',
        };
    }

    render() {
        const props = this.props;
        const state = this.state;
        const setState = this.setState.bind(this);

        const listAutoPurge = [
            'auto-purge-30-days-before-delete-cloud-180-days',
            'auto-purge-90-days-before-delete-cloud-180-days',
            'auto-purge-180-days-before-delete-cloud-180-days',
        ];

        const listDeleted = [
            'deleted'
        ];
        
        const descName = {
            'auto-purge-30-days-before-delete-cloud-180-days': 'Auto-Purge 30/180',
            'auto-purge-90-days-before-delete-cloud-180-days': 'Auto-Purge 90/180',
            'auto-purge-180-days-before-delete-cloud-180-days': 'Auto-Purge 180/180',
            'deleted': 'Deleted',
            'keep-forever': 'Keep Forever',
            'unknown': 'Unselected/New Arrival',
            '': 'Unselected/New Arrival',
            'delete': 'Schedule Delete',
            null: 'Unselected/New Arrival',
            undefined: 'Unselected/New Arrival',
            'restore': 'Restore',
            'cloud-180': 'Cloud 180 Days',
            'cloud-360': 'Cloud 360 Days',
            'cloud-720': 'Cloud 720 Days',
            'cloud-forever': 'Cloud Forever',
        };

        const cloud = [
            'cloud-180',
            'cloud-forever',
            'cloud-360',
            'cloud-720',
        ];

        const toStateFrom = {};

        const a = listAutoPurge.concat(['delete', 'keep-forever']);

        forEachItemSet(toStateFrom, listAutoPurge, a);
        forEachItemSet(toStateFrom, ['delete', 'keep-forever', 'unknown'], a);
        forEachItemSet(toStateFrom, ['', null, undefined], a);
        forEachItemSet(toStateFrom, ['deleted'], ['restore']);
        forEachItemSet(toStateFrom, ['restore'], ['restore', 'deleted'])
        forEachItemSet(toStateFrom, ['cloud-180'], cloud);

        const options = [];

        const curState = state.value;
        const curFutureStates = toStateFrom[curState];

        if (curFutureStates !== null && curFutureStates !== undefined) {
            let curStateAdded = false;

            for (let x = 0; x < curFutureStates.length; ++x) {
                let v = curFutureStates[x];
                let vDescriptive = descName[v] ? descName[v] : null;

                if (v === curState) {
                    curStateAdded = true;
                }

                if (vDescriptive !== null) {
                    options.push(<option key={v} value={v}>{vDescriptive}</option>);
                }
            }

            let vDescriptive = descName[curState] ? descName[curState] : '?' + curState;

            if (curStateAdded === false) {
                options.push(<option key={curState} value={curState}>{vDescriptive}</option>);
            }
        }

        const retryCancel = () => {
            setState({
                value: props.value,
                state: 'success',
            })
        };

        const onChange = (newValue) => {
            setState({
                value: newValue,
                state: 'pending',
            });

            props.updater.setState(props.sid, newValue, (success) => {
                if (success) {
                    setState({
                        state: 'success',
                    });
                } else {
                    setState({
                        state: 'error',
                    })
                }
            });
        };

        const isDisabled = props.user.admin === true ? false : true;

        // <select validationState={} disabled={isDisabled} value={curState} onChange={onChange}>
        switch (state.state) {
            case 'success':
                return <select disabled={isDisabled} value={curState} onChange={(e) => onChange(e.target.value)}>
                    {options}
                    </select>;
            case 'pending':
                return <span>Saving</span>
            case 'error':
                return <span>
                    <Button bsStyle="success" onClick={(e) => onChange(state.value)}>Retry Change</Button>
                    <Button bsStyle="warning" onClick={retryCancel}>Cancel Change</Button>
                    </span>;
        }
    }
}

/// <summary>
/// Represents the data item. Handles the rendering of the data item and the controls for it.
/// </summary>
/// <prop name="index">The descriptive index of the item within all items.</prop>
/// <prop name="item">The item object.</prop>
/// <prop name="updater">The object with callable methods to schedule changes.</prop>
/// <prop name="viewer">The object with callable methods to view items.</prop>
/// <prop name="user">The user currently viewing this component.</prop>
class MDACSDataItem extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showEditBox: false,
            editTarget: null,
        };
    }

    render() {
        const state = this.state;
        const props = this.props;
        const setState = this.setState.bind(this);
        const item = props.item;
        const updater = props.updater;
        const viewer = props.viewer;

        const onViewClick = (e) => {
            e.preventDefault();

            viewer.viewItemStack(item);
        };

        const childrenCount = item.children ? item.children.length : 0;
        const dataType = item.datatype;

        const user = props.user;

        const failed = props.failed;

        let viewButton = <Button bsSize="xsmall" bsStyle="link" onClick={onViewClick}>View [{dataType}:{childrenCount + 1}]</Button>;

        if (item.state.indexOf('cloud-') === 0) {
            if (item.fqpath === null) {
                viewButton = 'Only copy stored in the cloud.';
            }
        } else {
            if (item.fqpath === null) {
                viewButton = 'Deleted';
            }
        }

        return <tr>
                <td>{props.index}</td>
                <td><MDACSDataItemState 
                        hasFailed={failed.state === true ? true : false} 
                        user={user} 
                        value={item.state} 
                        sid={item.security_id} 
                        updater={updater}/></td>
                <td><MDACSDataItemDate 
                        hasFailed={false}
                        user={user} item={item} sid={item.security_id} updater={updater}/></td>
                <td><MDACSDataItemTime 
                        hasFailed={false} 
                        user={user} item={item} sid={item.security_id} updater={updater}/></td>
                <td><MDACSDataItemUser 
                        hasFailed={false}
                        user={user} value={item.userstr} sid={item.security_id} updater={updater}/></td>
                <td><MDACSDataItemDevice 
                        hasFailed={false}
                        user={user} value={item.devicestr} sid={item.security_id} updater={updater}/></td>
                <td>{viewButton}</td>
                <td style={{ width: '100%' }}>
                    <MDACSDataItemNote 
                        hasFailed={failed.note === true ? true : false} 
                        user={user} value={item.note} sid={item.security_id} updater={updater}/></td>
            </tr>;
    }
}