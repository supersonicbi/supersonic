import Color from 'colorjs.io';

const IS_HEX_CODE_COLOR_REGEX = /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/;
export const isHexCodeColor = (color: string): boolean => {
    return IS_HEX_CODE_COLOR_REGEX.test(color);
};
export const readableColor = (backgroundColor: string) => {
    if (!isHexCodeColor(backgroundColor)) {
        return 'black';
    }
    const onWhite = Math.abs(Color.contrastAPCA('white', backgroundColor));
    const onBlack = Math.abs(Color.contrastAPCA('black', backgroundColor));
    return onWhite > onBlack ? 'white' : 'black';
};

const getColorRange = (colorConfig: {
    start: string;
    end: string;
    steps: number;
}): string[] | undefined => {
    if (
        !isHexCodeColor(colorConfig.start) ||
        !isHexCodeColor(colorConfig.end)
    ) {
        return undefined;
    }

    // TODO
    const colors = Color.steps(
        // new Color(colorConfig.start),
        // new Color(colorConfig.end),
        colorConfig.start,
        colorConfig.end,
        {
            steps: colorConfig.steps,
            space: 'srgb',
        },
    );

    // return colors.map((c) => new Color(c).toString({ format: 'hex' }));
    return colors.map((c) => c.coords.toString());
};

export const getColorFromRange = (
    value: number,
    config: {
        color: {
            start: string;
            end: string;
            steps: number;
        };
        rule: {
            min: number;
            max: number;
        };
    },
): string | undefined => {
    const colors = getColorRange(config.color);
    if (!colors) return undefined;

    const min = config.rule.min;
    const inclusiveMax = config.rule.max + 1;

    const step = (inclusiveMax - min) / config.color.steps;
    const index = Math.floor((value - min) / step);

    return colors[index];
};
