export type MedalTier = {
    level: number
    name: string
    emoji: string
    className: string
    isLegendary: boolean
}

export function getMedalTier(points: number): MedalTier | null {
    if (points <= 0) return null

    if (points >= 10) {
        return {
            level: 4,
            name: '명예훈장',
            emoji: '',
            className: 'medal-legendary',
            isLegendary: true,
        }
    }

    if (points >= 7) {
        return {
            level: 3,
            name: '금훈장',
            emoji: '\uD83E\uDD47',
            className: 'medal-gold',
            isLegendary: false,
        }
    }

    if (points >= 4) {
        return {
            level: 2,
            name: '은훈장',
            emoji: '\uD83E\uDD48',
            className: 'medal-silver',
            isLegendary: false,
        }
    }

    return {
        level: 1,
        name: '동훈장',
        emoji: '\uD83E\uDD49',
        className: 'medal-bronze',
        isLegendary: false,
    }
}

export function getMedalPoints(type: string): number {
    switch (type) {
        case 'MVP':
            return 1
        default:
            return 0
    }
}
