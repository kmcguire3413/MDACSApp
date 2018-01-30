function generate_sample_data(count) {
    function padleftzero(v) {
        if (v.length == 1) {
            return '0' + v;
        }

        return v;
    }

    function cf(l) {
        let m = Math.floor(Math.random() * l.length);

        return l[m];
    }

    let users = [
        'bob',
        'mark',
        'jill',
        'bill',
        'bryan',
        'josh',
        'kevin',
        'sue',
        'beth',
        'alicia',
        'jasmine',
    ];

    let devices = [
        'gopro3029',
        'bodycam45',
        'laptop293',
        'upload',
        'gopro3832',
        'bodycam86',
    ];

    let tmp = [];

    for (let x = 0; x < count; ++x) {
        let year = padleftzero(Math.floor(Math.random() * 2000 + 1900).toString());
        let month = padleftzero(Math.floor(Math.random() * 12 + 1).toString());
        let day = padleftzero(Math.floor(Math.random() * 25 + 1).toString());
        let hour = padleftzero(Math.floor(Math.random() * 24).toString());
        let minute = padleftzero(Math.floor(Math.random() * 60).toString());
        let second = padleftzero(Math.floor(Math.random() * 60).toString());

        let item = {
            datestr: year + month + day,
            timestr: hour + minute + second,
            userstr: cf(users),
            devicestr: cf(devices),
            note: '',
            security_id: x,
            state: 'Auto-Purge 90-Days Then Cloud 180-Days',
        };

        tmp.push(item);
    }

    tmp = {
        data: tmp,
    };

    return JSON.stringify(tmp);
}

/// <prop name="user">The user viewing this component.</prop>
/// <prop name="dao">The data (database in this case) access object, with methods.</prop>
class MDACSDataViewSummary extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            state: 'loading',
        };
    }

    componentDidMount() {
        this.refresh();
    }

    refresh() {
        this.props.dao.spaceInfo(
            (info) => {
                this.setState({
                    state: 'loaded',
                    used_bytes: info.used_bytes,
                    max_bytes: info.max_bytes,
                });
            },
            () => {
                this.setState({
                    state: 'error',
                });
            }
        );        
    }

    render() {
        const state = this.state;
        const refresh = this.refresh;
        const props = this.props;

        switch (state.state) {
            case 'loading':
                return <Panel>Loading summary information...</Panel>;
            case 'loaded':
            {
                const usedPercentage = Math.round(state.used_bytes / state.max_bytes * 100.0);
                const privType = props.user.admin ? 'administrator' : 'normal user';

                let filterNote = null;

                if (props.user.userfilter !== null) {
                    filterNote = 'The data is filtered using the expression ' + props.user.userfilter + '.';
                } else {
                    filterNote = 'The data is not filtered using an expression.';
                }

                return <Panel>
                        <Alert>
                            <div>
                                Currently, {usedPercentage}% of total space has been utilized.
                            </div>
                            <div>
                                You are logged in with the username {props.user.user} which has {privType} privileges. {filterNote}
                            </div>
                        </Alert>
                    </Panel>;
            }
            case 'error':
                return <Panel>
                        <Button bsStyle="success" onClick={refresh}>Try Loading Summary Again</Button>
                    </Panel>;
        }
    }
}

class MDACSDeviceConfiguration extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
    }
}

class MDACSConfigurationList extends React.Component {
    constructor(props) {
        super(props) 
    }

    render() {
    }
}

/// <summary>
/// Generate the initial state for the MDACSDataModule component.
/// </summary>
const MDACSDatabaseModuleStateGenerator = (props, setState) => {
    let state = {
        data: null,
        error: null,
        beginIndex: 0,
        endIndex: 50,
        visibleCount: 50,
        dataCount: 0,
        pendingOperationCount: 0,
        builtInitialSubset: false,
        workerStatus: 'Loading...',
        worker: new Worker('utility?MDACSDataWorker.js'),
        opFailedItems: {},
        searchValue: '',
        toggleDeletedbuttonText: 'Show Deleted',
        showDeleted: false,
        currentlyViewingItems: null,
        itemViewStuff: null,
        usersInSubset: {},
    };

    // Hook up mutator to the worker message handler.
    state.worker.onmessage = 
        (e) => {
            MDACSDatabaseModuleMutators.onWorkerMessage(
                props,
                state,
                setState,
                e
            );
        };

    return state;
};

/// <summary>
/// A set of functions that mutate the state of the MDACSDataModule.
/// </summary>
const MDACSDatabaseModuleMutators = {
    onWorkerMessage: (props, state, setState, e) => {
        let msg = e.data;

        switch (msg.topic) {
            case 'LoadDataStringDone':
            {
                setState({
                    builtInitialSubset: true,
                });

                state.worker.postMessage({
                    topic: 'ProduceSubSet',
                    criteria: [],
                    showDeleted: state.showDeleted,
                });
                break;
            }
            case 'ProduceSubSetDone':
            {
                setState({
                    beginIndex: 0,
                    endIndex: state.visibleCount,
                    dataCount: msg.count,
                    usersInSubset: msg.usersFound,
                });

                state.worker.postMessage({
                    topic: 'GetSubSetOfSubSet',
                    beginIndex: 0,
                    endIndex: state.visibleCount
                });
                break;
            }
            case 'GetSubSetOfSubSetDone':
            {
                setState({
                    data: msg.subset,
                });
                break;
            }
            case 'Status':
            {
                setState({
                    workerStatus: msg.status,
                });

                console.log('status', msg.status);
                break;
            }
        }
    },
    prevPage: (props, state, setState) => {
        setState((prevState, props) => {
            state.worker.postMessage({
                topic: 'GetSubSetOfSubSet',
                beginIndex: prevState.beginIndex - prevState.visibleCount,
                endIndex: prevState.endIndex - prevState.visibleCount,
            });

            return {
                beginIndex: prevState.beginIndex - prevState.visibleCount,
                endIndex: prevState.endIndex - prevState.visibleCount,
                data: null,
            }
        });
    },
    nextPage: (props, state, setState) => {
        setState((prevState, props) => {
            state.worker.postMessage({
                topic: 'GetSubSetOfSubSet',
                beginIndex: prevState.beginIndex + prevState.visibleCount,
                endIndex: prevState.endIndex + prevState.visibleCount,
            });

            return {
                beginIndex: prevState.beginIndex + prevState.visibleCount,
                endIndex: prevState.endIndex + prevState.visibleCount,
                data: null,
            }
        });
    },
    onSearchChange: (props, state, setState, e) => {
        e.preventDefault();

        setState({
            searchValue: e.target.value,
        });
    },
    onSearchClick: (props, state, setState, searchValue) => {
        state.worker.postMessage({
            topic: 'ProduceSubSet',
            criteria: searchValue.split(' '),
            showDeleted: state.showDeleted,
        });
    },
    onReloadData: (props, state, setState, e) => {
        if (e !== null && e !== undefined) {
            e.preventDefault();
        }

        setState({
            error: null,
            data: null,
            workerStatus: 'Loading...',
            searchValue: '',
        });

        props.dao.data_noparse(
            (dataString) => {
                //dataString = generate_sample_data(10000);

                setState({
                    error: null,
                    data: null,
                });

                state.worker.postMessage({
                    topic: 'LoadDataString',
                    dataString: dataString,
                });
            },
            (res) => {
                console.log('data fetch error', res);
                setState({
                    error: 'A problem happened when retrieving data from the server.',
                });
            }
        );
    },
    onToggleDeleted: (props, state, setState, e) => {
        if (state.toggleDeletedbuttonText === 'Show Deleted') {
            setState({
                toggleDeletedbuttonText: 'Hide Deleted',
                beginIndex: 0,
                endIndex: state.visibleCount, 
                showDeleted: true,
                searchValue: '',
            })

            state.worker.postMessage({
                topic: 'ProduceSubSet',
                criteria: [],
                showDeleted: true,
            });
        } else {
            setState({
                toggleDeletedbuttonText: 'Show Deleted',
                beginIndex: 0,
                endIndex: state.visibleCount,
                showDeleted: false,
                searchValue: '',
            })

            state.worker.postMessage({
                topic: 'ProduceSubSet',
                criteria: [],
                showDeleted: false,
            });
        }
    },
    setItemState: (props, state, setState, sid, newState, cb) => {
        setState((prev, props) => {
            return { pendingOperationCount: prev.pendingOperationCount + 1 };
        });

        state.worker.postMessage({
            topic: 'SetState',
            sid: sid,
            value: newState,
        });        

        props.dao.setState(
            sid, 
            newState,
            () => {
                setState((prev, props) => {
                    return { pendingOperationCount: prev.pendingOperationCount - 1 };
                });

                cb(true);
            },
            () => {
                setState((prev, props) => {
                    return { 
                        pendingOperationCount: prev.pendingOperationCount - 1 
                    };
                });
                

                cb(false);
            }
        );
    },
    setItemNote: (props, state, setState, sid, newNote, cb) => {
        setState((prev, props) => {
            return { pendingOperationCount: prev.pendingOperationCount + 1 };
        });

        state.worker.postMessage({
            topic: 'SetNote',
            sid: sid,
            value: newNote,
        });

        props.dao.setNote(
            sid, 
            newNote, 
            () => {
                setState((prev, props) => {
                    return { pendingOperationCount: prev.pendingOperationCount - 1 };
                });

                cb(true);
            },
            () => {
                setState((prev, props) => {
                    return { pendingOperationCount: prev.pendingOperationCount - 1 };
                });

                cb(false);
            }
        );
    },
    viewItemStack: (props, state, setState, item) => {
        let itemsUnstacked = [];

        itemsUnstacked.push(item);

        for (let x = 0; x < item.children.length; ++x) {
            itemsUnstacked.push(item.children[x]);
        }

        setState({
            currentlyViewingItems: itemsUnstacked,
        });  
    },
};

const MDACSDatabaseModuleViews = {
    Main: (props, state, setState, mutators, updaterInterface, viewerInterface) => {
        let errorView;

        const prevPage = () => mutators.prevPage(props, state, setState);
        const nextPage = () => mutators.nextPage(props, state, setState);
        const onSearchChange = (e) => mutators.onSearchChange(props, state, setState, e);
        const onSearchClick = (searchValue) => mutators.onSearchClick(props, state, setState, searchValue);
        const reloadData = (e) => mutators.onReloadData(props, state, setState, e);
        const toggleDeleted = (e) => mutators.onToggleDeleted(props, state, setState, e);
        const onClearSearch = (e) => {
            e.preventDefault();

            setState({
                searchValue: '',
            });

            state.worker.postMessage({
                topic: 'ProduceSubSet',
                criteria: [],
                showDeleted: state.showDeleted,
            });                
        };

        ///////////////////////////////////////////////

        if (state.error !== null) {
            errorView = <Alert>{state.error}</Alert>;
        } else {
            errorView = null;
        }

        ///////////////////////////////////////////////

        let usersInSubsetButtons = [];

        let buildUserSearchClickHandler = (userName) => {
            return (e) => {
                setState({
                    searchValue: userName,
                });

                onSearchClick(userName);
            }
        }  
        
        for (let userName in state.usersInSubset) {
            let handler = buildUserSearchClickHandler(userName);

            usersInSubsetButtons.push(
                <Button onClick={handler}>Filter By {userName}</Button>
            );
        }        

        let bar = <Table>
                    <thead>
                        <tr>
                            <td></td>
                            <td style={{width: '100%'}}></td>
                            <td></td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div style={{ margin: '0.2in' }}>
                                    <Button onClick={prevPage}>Previous Page</Button>
                                </div>
                                <div style={{ margin: '0.2in' }}>
                                    <Button onClick={nextPage}>Next Page</Button>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <form onSubmit={(e) => { e.preventDefault(); onSearchClick(state.searchValue);}}>
                                        <div>
                                            <Button type="submit">Search</Button>
                                            <Button onClick={onClearSearch}>Clear Search</Button>
                                            <FormControl
                                                id="searchText"
                                                type="text"
                                                value={state.searchValue}
                                                placeholder="Type search words here."
                                                onChange={onSearchChange}
                                            />
                                        </div>
                                        <div>
                                            {usersInSubsetButtons}                                            
                                        </div>
                                    </form>
                                </div>
                                <hr/>
                                <div>
                                    <strong>
                                        Showing {state.beginIndex + 1} to {state.endIndex} items out of {state.dataCount} items using the search string "{state.searchValue}".
                                    </strong>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <Button onClick={reloadData}>Reload</Button>
                                </div>
                                <div>
                                    <Button onClick={toggleDeleted}>{state.toggleDeletedbuttonText}</Button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </Table>;

        ///////////////////////////////////////////////

        let statusHeader = null;

        if (state.pendingOperationCount > 0) {
            statusHeader = <span style={{ 
                border: '1px solid black', 
                margin: '2px', 
                padding: '10px', 
                backgroundColor: 'white', 
                position: 'fixed', 
                top: '0px' 
            }}>Pending Updates: {state.pendingOperationCount}</span>;
        }

        ///////////////////////////////////////////////

        let dataViewPanel = <div>
                <Panel bsStyle="primary">
                    <Panel.Heading>
                        <Panel.Title componentClass="h3">Data View and Edit</Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        <div>
                            {bar}
                        </div>
                        <MDACSDataViewSummary user={props.user} dao={props.dao}/>
                        <h3>{state.workerStatus}</h3>
                        <h3>{errorView}</h3>
                            <MDACSDataView
                                failed={state.opFailedItems}
                                user={props.user}
                                viewer={viewerInterface}
                                updater={updaterInterface} 
                                data={state.data} 
                                beginIndex={state.beginIndex} 
                                endIndex={state.endIndex} />
                        <div>
                            {bar}
                        </div>
                    </Panel.Body>
                </Panel>
                {statusHeader}
            </div>;

        const goBack = (e) => {
            e.preventDefault();

            setState({
                currentlyViewingItems: null,
            });
        };

        if (state.currentlyViewingItems === null) {
            return dataViewPanel;
        } else {
            // The panel for displaying single or stacked items. The stacked items are unstacked
            // and ordered from first to last as the value to the property `items`.
            return <MDACSItemsView goBack={goBack} dao={props.dao} items={state.currentlyViewingItems}/>;
        }

    },
};

/// <prop name="dao">DAO for the database service.</prop>
/// <prop name="user">The user viewing this component.</prop>
class MDACSDatabaseModule extends React.Component {
    constructor(props) {
        super(props);

        const boundSetState = this.setState.bind(this);

        this.state = MDACSDatabaseModuleStateGenerator(props, boundSetState);
    }

    componentDidMount() {
        MDACSDatabaseModuleMutators.onReloadData(
            this.props,
            this.state,
            this.setState.bind(this),
            null
        );
    }

    componentWillUnmount() {
    }

    render() {
        // More indirection. But, it does form an interface and that keeps anyone
        // in the future from having a direct reference to `this` and relying 
        // on functionality not intended to be exported as part of the updater
        // interface.

        const boundSetState = this.setState.bind(this);
        const props = this.props;
        const state = this.state;

        let updaterInterface = {
            setNote: (sid, newNote, cb) =>
                MDACSDatabaseModuleMutators.setItemNote(
                    props, 
                    state,
                    boundSetState,
                    sid,
                    newNote,
                    cb
                )
            ,
            setState: (sid, newState, cb) =>
                MDACSDatabaseModuleMutators.setItemState(
                    props,
                    state,
                    boundSetState,
                    sid,
                    newState,
                    cb
                )
            ,
        }

        let viewerInterface = {
            viewItemStack: (item) =>
                MDACSDatabaseModuleMutators.viewItemStack(
                    props,
                    state,
                    boundSetState,
                    item
                ),
        };

        return MDACSDatabaseModuleViews.Main(
            this.props,
            this.state,
            this.setState.bind(this),
            MDACSDatabaseModuleMutators,
            updaterInterface,
            viewerInterface
        );
    }
}