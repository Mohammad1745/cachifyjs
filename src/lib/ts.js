export default function toMs(timeString) {
    if (typeof timeString === 'number') return timeString
    if (timeString.length > 2 && timeString.slice(-2) === 'ms') {
        timeString = timeString.slice(0, -2)
    }

    const timeSpecifiers = ['s', 'm', 'h', 'd', 'w']
    const timeMultipliers = [1000, 60, 60, 24, 7]
    const specifier = timeString.slice(-1);
    let time = 1;

    if (timeSpecifiers.includes(specifier)) {
        time = Number(timeString.slice(0, -1));
        if (isNaN(time)) throw new Error('Invalid time 1')
        for (let i = 0; i < timeSpecifiers.length; i++) {
            time *= timeMultipliers[i];
            if (specifier === timeSpecifiers[i]) {
                break
            }
        }
    }
    else {
        time = Number(timeString)
    }

    if (isNaN(time)) throw new Error('Invalid time 2')
    return time
}