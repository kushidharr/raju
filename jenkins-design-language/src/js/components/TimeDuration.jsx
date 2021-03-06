// @flow

import React, {Component, PropTypes} from 'react';
import moment from 'moment';

// So moment is properly initialized:
import 'moment-duration-format';
import 'moment/min/locales.min';

type Props = {
     millis: number,
     updatePeriod: number,
     hint?: string,
     liveUpdate: bool,
     displayFormat: ?string,
     liveFormat: ?string,
     hintFormat: ?string,
     locale: ?string,
};

type State = {
    elapsed: number
};

/**
 * Displays a millisecond duration as text in moment-duration-format's "humanize()" format,
 * e.g. "a few seconds", "2 hours", etc.
 * Also displays tooltip with more precise duration in "mos, days, hours, mins, secs" format.
 * Tooltip text can be overridden via "hint" property.
 * Set liveUpdate=true to tick the duration up as time elapses.
 *
 * Properties:
 * "millis": number or string.
 * "hint": string to use for tooltip.
 * "liveUpdate": boolean
 */
export class TimeDuration extends Component {

    props: Props;
    state: State;
    timerPeriodMillis: number;
    clearIntervalId: number;

    constructor(props: Props) {
        super(props);
        // track how much time has elapsed since live updating tracking started
        this.state = { elapsed: 0 };
        const {updatePeriod = 5000} = this.props;
        this.timerPeriodMillis = typeof updatePeriod !== 'number' || isNaN(updatePeriod) ? 5000 : updatePeriod;
        this.clearIntervalId = 0;

    }

    componentWillMount() {
        this._handleProps(this.props);
    }

    componentWillReceiveProps(nextProps: Props) {
        this._handleProps(nextProps);
    }

    _handleProps(props: Props) {
        if (this.clearIntervalId) {
            clearInterval(this.clearIntervalId);
            this.clearIntervalId = 0;
        }

        if (props.millis >= 0 && props.liveUpdate) {
            this.clearIntervalId = setInterval(() => {
                this._updateTime();
            }, this.timerPeriodMillis);
        }

        // if live update is disabled, we no longer need to track elapsed time
        if (!props.liveUpdate) {
            this.setState({
                elapsed: 0,
            });
        }
    }

    _updateTime() {
        const elapsed = this.state.elapsed + this.timerPeriodMillis;
        this.setState({
            elapsed
        });
    }

    static format(value, t, locale) {
        const displayFormat = t('common.date.duration.display.format', { defaultValue: 'd[d] h[h] m[m] s[s]' });

        moment.locale(locale);

        if (!isNaN(value)) {
            if(value < 1000) {
                return '<1s';
            }
            return moment.duration(value).format(displayFormat);
        } else {
            return '-';
        }
    }

    componentWillUnmount() {
        if (this.clearIntervalId) {
            clearInterval(this.clearIntervalId);
            this.clearIntervalId = 0;
        }
    }

    render() {
        const millis = parseInt(this.props.millis) + this.state.elapsed;

        if (!isNaN(millis)) {
            if(millis < 1000) {
                return (
                    <span title={this.props.hint ? this.props.hint : '<1s'}>&#x3C;1s</span>
                );
            }

            const {
                locale = 'en',
                t,
            } = this.props;

            const duration = TimeDuration.format(millis, t, locale);
            const hintFormat = t('common.date.duration.hint.format', { defaultValue: 'M [month], d [days], h[h], m[m], s[s]' });

            moment.locale(locale);
            const hint = this.props.hint ?
                this.props.hint : moment.duration(millis).format(hintFormat);

            return (
                <span title={hint}>{duration}</span>
            );
        }

        return (<span>-</span>);
    }
}

TimeDuration.propTypes = {
    millis: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    updatePeriod: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    hint: PropTypes.string,
    liveUpdate: PropTypes.bool,
    locale: PropTypes.string,
    t: PropTypes.func,
};
