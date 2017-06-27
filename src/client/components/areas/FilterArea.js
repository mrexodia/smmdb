import React from 'react'
import {
    connect
} from 'react-redux'

import SMMButton from '../buttons/SMMButton'

import {
    applyFilter, setFilter, showFilter
} from '../../actions'

const MAX_LENGTH_TITLE    = 0x20;
const MAX_LENGTH_MAKER    = 0x20;
const MAX_LENGTH_UPLOADER = 0x20;

class FilterArea extends React.PureComponent {
    constructor (props) {
        super(props);
        this.state = {};
        this.getFilter = this.getFilter.bind(this);
        this.setFilter = this.setFilter.bind(this);
        this.onFilterHide = this.onFilterHide.bind(this);
        this.onTitleChange = this.onStringChange.bind(this, 'title', MAX_LENGTH_TITLE);
        this.onMakerChange = this.onStringChange.bind(this, 'maker', MAX_LENGTH_MAKER);
        this.onUploaderChange = this.onStringChange.bind(this, 'uploader', MAX_LENGTH_UPLOADER);
        this.onLastModifiedFromChange = this.onDateChange.bind(this, 'lastmodifiedfrom');
        this.onLastModifiedToChange = this.onDateChange.bind(this, 'lastmodifiedto');
        this.onUploadedFromChange = this.onDateChange.bind(this, 'uploadedfrom');
        this.onUploadedToChange = this.onDateChange.bind(this, 'uploadedto');
        this.onDifficultyFromChange = this.onSelectChange.bind(this, 'difficultyfrom');
        this.onDifficultyToChange = this.onSelectChange.bind(this, 'difficultyto');
        this.onGameStyleChange = this.onSelectChange.bind(this, 'gamestyle');
        this.onCourseThemeChange = this.onSelectChange.bind(this, 'coursetheme');
        this.onCourseThemeSubChange = this.onSelectChange.bind(this, 'coursethemesub');
    }
    componentWillMount () {
        const filter = this.props.filter.toJS();
        if (!!filter) {
            this.setState({
                title: !!filter.title ? filter.title : '',
                maker: !!filter.maker ? filter.maker : '',
                uploader: !!filter.uploader ? filter.uploader : '',
                lastmodifiedfrom: !!filter.lastmodifiedfrom ? filter.lastmodifiedfrom : NaN,
                lastmodifiedto: !!filter.lastmodifiedto ? filter.lastmodifiedto : NaN,
                uploadedfrom: !!filter.uploadedfrom ? filter.uploadedfrom : NaN,
                uploadedto: !!filter.uploadedto ? filter.uploadedto : NaN,
                difficultyfrom: !!filter.difficultyfrom ? filter.difficultyfrom : '',
                difficultyto: !!filter.difficultyto ? filter.difficultyto : '',
                gamestyle: !!filter.gamestyle ? filter.gamestyle : '',
                coursetheme: !!filter.coursetheme ? filter.coursetheme : '',
                coursethemesub: !!filter.coursethemesub ? filter.coursethemesub : '',
            });
        }
    }
    getFilter () {
        const filter = {
            title: this.state.title,
            maker: this.state.maker,
            uploader: this.state.uploader,
            lastmodifiedfrom: this.state.lastmodifiedfrom,
            lastmodifiedto: this.state.lastmodifiedto,
            uploadedfrom: this.state.uploadedfrom,
            uploadedto: this.state.uploadedto,
            difficultyfrom: this.state.difficultyfrom,
            difficultyto: this.state.difficultyto,
            gamestyle: this.state.gamestyle,
            coursetheme: this.state.coursetheme,
            coursethemesub: this.state.coursethemesub,
        };
        if (!this.state.title) delete filter.title;
        if (!this.state.maker) delete filter.maker;
        if (!this.state.uploader) delete filter.uploader;
        if (!this.state.lastmodifiedfrom) delete filter.lastmodifiedfrom;
        if (!this.state.lastmodifiedto) delete filter.lastmodifiedto;
        if (!this.state.uploadedfrom) delete filter.uploadedfrom;
        if (!this.state.uploadedto) delete filter.uploadedto;
        if (!this.state.difficultyfrom) delete filter.difficultyfrom;
        if (!this.state.difficultyto) delete filter.difficultyto;
        if (!this.state.gamestyle) delete filter.gamestyle;
        if (!this.state.coursetheme) delete filter.coursetheme;
        if (!this.state.coursethemesub) delete filter.coursethemesub;
        return filter;
    }
    setFilter () {
        const filter = this.getFilter();
        this.props.dispatch(setFilter(filter));
        this.props.dispatch(showFilter(false));
        this.props.dispatch(applyFilter());
    }
    onFilterHide () {
        const filter = this.getFilter();
        this.props.dispatch(setFilter(filter));
        this.props.dispatch(showFilter(false));
    }
    onStringChange (value, limit, e) {
        let val = e.target.value;
        if (val.length > limit) {
            val = val.substr(0, limit);
        }
        const res = {};
        res[value] = val;
        this.setState(res);
    }
    onDateChange (value, e) {
        const offset = (new Date()).getTimezoneOffset() * -1;
        const sign = (new Date()).getTimezoneOffset() >= 0 ? '-' : '+';
        const res = {};
        res[value] = (new Date(`${e.target.value}${sign}${(offset / 60).pad(2)}:${(offset % 60).pad(2)}`)).valueOf() / 1000;
        this.setState(res);
    }
    onSelectChange (value, e) {
        const val = e.target.value;
        const res = {};
        res[value] = val;
        this.setState(res);
    }
    render () {
        const filter = this.props.filter.toJS();
        const styles = {
            area: {
                width: '1050px',
                height: 'auto',
                margin: 'auto',
                backgroundColor: '#ffcf00',
                borderRadius: '12px',
                boxShadow: '0px 0px 4px 12px rgba(0,0,0,0.1)',
                fontSize: '24px',
                padding: '15px 5px',
                zIndex: '101'
            },
            title: {
                width: 'calc(100% - 44px)',
                textAlign: 'center',
                fontSize: '34px',
                height: '40px',
                lineHeight: '40px'
            },
            close: {
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                float: 'right',
                margin: '6px',
                backgroundColor: '#11c2b0',
                borderRadius: '5px',
                padding: '2px'
            },
            option: {
                height: 'auto',
                width: '50%',
                padding: '10px'
            },
            value: {
                height: '32px',
                lineHeight: '32px'
            },
            input: {
                height: '32px',
                fontSize: '18px'
            },
            date: {
                height: 'auto'
            },
            dateInput: {
                width: 'auto',
                height: '32px',
                fontSize: '18px'
            }
        };
        return (
            <div style={styles.area}>
                <div style={styles.title}>
                    Filters
                </div>
                <div style={styles.close} onClick={this.onFilterHide}>
                    <img src="/img/cancel.svg" />
                </div>
                <div style={styles.option}>
                    <div style={styles.value}>
                        Title:
                    </div>
                    <input style={styles.input} value={this.state.title} onChange={this.onTitleChange} />
                </div><br />
                <div style={styles.option}>
                    <div style={styles.value}>
                        Maker:
                    </div>
                    <input style={styles.input} value={this.state.maker} onChange={this.onMakerChange} />
                </div>
                <div style={styles.option}>
                    <div style={styles.value}>
                        Uploader:
                    </div>
                    <input style={styles.input} value={this.state.uploader} onChange={this.onUploaderChange} />
                </div>
                <div style={styles.option}>
                    <div style={styles.value}>
                        Last modified:
                    </div>
                    <div style={styles.date}>
                        <span>from </span>
                        <input style={styles.dateInput} type="datetime-local" value={
                            isNaN(this.state.lastmodifiedfrom) ? '' :
                                (new Date(this.state.lastmodifiedfrom * 1000 - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, -1)
                        } onChange={this.onLastModifiedFromChange} /><br />
                        <span>to </span>
                        <input style={styles.dateInput} type="datetime-local" value={
                            isNaN(this.state.lastmodifiedto) ? '' :
                                (new Date(this.state.lastmodifiedto * 1000 - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, -1)
                        } onChange={this.onLastModifiedToChange} />
                    </div>
                </div>
                <div style={styles.option}>
                    <div style={styles.value}>
                        Uploaded:
                    </div>
                    <div style={styles.date}>
                        <span>from </span>
                        <input style={styles.dateInput} type="datetime-local" value={
                            isNaN(this.state.uploadedfrom) ? '' :
                                (new Date(this.state.uploadedfrom * 1000 - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, -1)
                        } onChange={this.onUploadedFromChange} /><br />
                        <span>to </span>
                        <input style={styles.dateInput} type="datetime-local" value={
                            isNaN(this.state.uploadedto) ? '' :
                                (new Date(this.state.uploadedto * 1000 - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, -1)
                        } onChange={this.onUploadedToChange} />
                    </div>
                </div>
                <div style={styles.option}>
                    <div style={styles.value}>
                        Difficulty:
                    </div>
                    <div style={styles.date}>
                        <span>from </span>
                        <select style={styles.dateInput}  value={this.state.difficultyfrom} onChange={this.onDifficultyFromChange}>
                            <option value="" />
                            <option value="0">Easy</option>
                            <option value="1">Normal</option>
                            <option value="2">Expert</option>
                            <option value="3">Super Expert</option>
                        </select>
                        <span> to </span>
                        <select style={styles.dateInput}  value={this.state.difficultyto} onChange={this.onDifficultyToChange}>
                            <option value="" />
                            <option value="0">Easy</option>
                            <option value="1">Normal</option>
                            <option value="2">Expert</option>
                            <option value="3">Super Expert</option>
                        </select>
                    </div>
                </div><br />
                <div style={styles.option}>
                    <div style={styles.value}>
                        Game Style:
                    </div>
                    <div style={styles.date}>
                        <select style={styles.dateInput}  value={this.state.gamestyle} onChange={this.onGameStyleChange}>
                            <option value="" />
                            <option value="0">Super Mario Bros</option>
                            <option value="1">Super Mario Bros 3</option>
                            <option value="2">Super Mario World</option>
                            <option value="3">New Super Mario Bros U</option>
                        </select>
                    </div>
                </div><br />
                <div style={styles.option}>
                    <div style={styles.value}>
                        Course Theme:
                    </div>
                    <div style={styles.date}>
                        <select style={styles.dateInput}  value={this.state.coursetheme} onChange={this.onCourseThemeChange}>
                            <option value="" />
                            <option value="0">Ground</option>
                            <option value="1">Underground</option>
                            <option value="2">Castle</option>
                            <option value="3">Airship</option>
                            <option value="4">Underwater</option>
                            <option value="5">Ghost House</option>
                        </select>
                    </div>
                </div>
                <div style={styles.option}>
                    <div style={styles.value}>
                        Subcourse Theme:
                    </div>
                    <div style={styles.date}>
                        <select style={styles.dateInput}  value={this.state.coursethemesub} onChange={this.onCourseThemeSubChange}>
                            <option value="" />
                            <option value="0">Ground</option>
                            <option value="1">Underground</option>
                            <option value="2">Castle</option>
                            <option value="3">Airship</option>
                            <option value="4">Underwater</option>
                            <option value="5">Ghost House</option>
                        </select>
                    </div>
                </div>
                <SMMButton text="Apply" iconSrc="/img/filter.svg" fontSize="13px" padding="3px" onClick={this.setFilter} />
            </div>
        )
    }
}
export default connect(state => {
    const filter = state.getIn(['filter', 'nextFilter']);
    return {
        filter
    }
})(FilterArea);

Number.prototype.pad = function (size) {
    let s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
};