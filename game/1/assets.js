export const ASSETS = {
    image: {
        'map': './src/map.png',
        'mailman': './src/mailman.png',
        'house_red': './src/house_red.png',
        'house_green': './src/house_green.png',
        'house_blue': './src/house_blue.png',
        'mailbox': './src/mailbox_small.png',
        'whitegoat': './src/whitegoat.png',
        'balloon': './src/balloon.png',
        'mailman_head': './src/mailman_head.png',
        'health': './src/health.png',
        'mails': './src/mails.png',
        'arrow': './src/arrow.png',
        'base': './src/base.png',
    },

    font: {
        'SolidLinker': './src/x12y16pxSolidLinker.ttf',
        'TheStrongGamer': './src/x8y12pxTheStrongGamer.ttf',
        'ScoreDozer': './src/x14y20pxScoreDozer.ttf',
    },

    spritesheet: {
        'mailman_ss': {
            'frame': {
                'width': 20,
                'height': 30,
                'cols': 5,
                'rows': 1,
            },
            'animations': {
                'stand': {
                    'frames': [0],
                    'next': 'stand',
                    'frequency': 1,
                },
                'left': {
                    'frames': [1, 1, 2, 1, 1, 3, 3, 4, 3, 3],
                    'next': 'left',
                    'frequency': 3,
                },
                'right': {
                    'frames': [3, 3, 4, 3, 3, 1, 1, 2, 1, 1],
                    'next': 'right',
                    'frequency': 3,
                },
            },
        },
        'goat_ss': {
            'frame': {
                'width': 42,
                'height': 30,
                'cols': 3,
                'rows': 1,
            },
            'animations': {
                'left': {
                    'frames': [0, 1, 0, 2],
                    'next': 'left',
                    'frequency': 10,
                },
                'right': {
                    'frames': [0, 2, 0, 1],
                    'next': 'right',
                    'frequency': 10,
                },
            },
        },
        'health_ss': {
            'frame': {
                'width': 54,
                'height': 20,
                'cols': 1,
                'rows': 4,
            },
            'animations': {
                '3': {
                    'frames': [0],
                    'next': '3',
                    'frequency': 1,
                },
                '2': {
                    'frames': [1],
                    'next': '2',
                    'frequency': 1,
                },
                '1': {
                    'frames': [2],
                    'next': '1',
                    'frequency': 1,
                },
                '0': {
                    'frames': [3],
                    'next': '0',
                    'frequency': 1,
                },
            },
        },
    },
};