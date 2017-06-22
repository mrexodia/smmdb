import React from 'react'
import {
    connect
} from 'react-redux'

import LoginButton from '../buttons/LoginButton'
import SMMButton   from '../buttons/SMMButton'
import {
    ScreenSize
} from '../../reducers/mediaQuery'

class TopBarArea extends React.PureComponent{
    render () {
        const screenSize = this.props.screenSize;
        const accountData = !!this.props.accountData ? this.props.accountData.toJS() : null;
        const styles = {
            topbar: {
                width: '100%',
                height: 'auto',
                padding: '10px',
                display: screenSize === ScreenSize.LARGE ? 'inline-flex' : 'none',
                alignItems: 'flex-start',
                flex: '0 0 auto'
            },
            right: {
                width: 'auto',
                height: 'auto'
            }
        };
        return (
            <div style={styles.topbar}>
                <div>
                    <SMMButton text="Courses" iconSrc="/img/courses.png" iconColor="dark" />
                    <SMMButton text="Upload" iconSrc="/img/upload.png" iconColor="dark" />
                    <SMMButton text="Profile" iconSrc="/img/profile.png" iconColor="dark" />
                    <a href="https://github.com/Tarnadas/smmdb" target="__blank">
                        <SMMButton text="API" iconSrc="/img/api.png" iconColor="dark" />
                    </a>
                    <a href="https://github.com/Tarnadas/cemu-smmdb/releases" target="__blank">
                        <SMMButton text="Client" iconSrc="/img/client.png" iconColor="dark" />
                    </a>
                    <a href="https://www.reddit.com/r/CemuMarioMaker" target="__blank">
                        <SMMButton text="Reddit" iconSrc="/img/reddit.png" iconColor="dark" />
                    </a>
                    <a href="https://discord.gg/0wURURBfQTrjAXqh" target="__blank">
                        <SMMButton text="Discord" iconSrc="/img/discord.png" iconColor="dark" />
                    </a>
                </div>
                <div style={styles.right}>
                    <LoginButton />
                </div>
            </div>
        );
    }
}
export default connect(state => {
    const screenSize = state.getIn(['mediaQuery', 'screenSize']);
    const accountData = state.getIn(['userData', 'accountData']);
    return {
        screenSize,
        accountData
    }
})(TopBarArea);