import { getMainRangeChannel, SECONDARY_RANGE_CHANNEL } from '../channel';
import { isFieldDef } from '../channeldef';
import * as log from '../log';
import { isUnitSpec } from '../spec/unit';
export class RuleForRangedLineNormalizer {
    constructor() {
        this.name = 'RuleForRangedLine';
    }
    hasMatchingType(spec) {
        if (isUnitSpec(spec)) {
            const { encoding, mark } = spec;
            if (mark === 'line') {
                for (const channel of SECONDARY_RANGE_CHANNEL) {
                    const mainChannel = getMainRangeChannel(channel);
                    const mainChannelDef = encoding[mainChannel];
                    if (!!encoding[channel] && isFieldDef(mainChannelDef) && mainChannelDef.bin !== 'binned') {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    run(spec, params, normalize) {
        const { encoding } = spec;
        log.warn(log.message.lineWithRange(!!encoding.x2, !!encoding.y2));
        return normalize(Object.assign({}, spec, { mark: 'rule' }), params);
    }
}
//# sourceMappingURL=ruleforrangedline.js.map